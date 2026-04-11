const { execFile } = require('child_process');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function provisionDockerEnvironment(labConfig, sessionId) {
  const containerName = `acadly-${labConfig.id}-${sessionId}`.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const args = ['run', '-d', '--rm', '--name', containerName];

  const ports = labConfig.runtime?.ports || [];
  const env = labConfig.runtime?.env || {};

  for (const pair of ports) {
    args.push('-p', `${pair.host}:${pair.container}`);
  }

  for (const [key, value] of Object.entries(env)) {
    args.push('-e', `${key}=${value}`);
  }

  args.push(labConfig.runtime.image);

  try {
    const containerId = await runCommand('docker', args);
    return {
      provider: 'docker',
      resourceId: containerId,
      shell: {
        type: 'docker-exec',
        command: ['docker', 'exec', '-it', containerName, '/bin/sh'],
      },
      metadata: { containerName },
    };
  } catch (error) {
    return {
      provider: 'docker',
      resourceId: randomId('mock-docker'),
      shell: {
        type: 'simulated-shell',
        command: ['echo', 'Docker daemon unavailable in this environment; running in simulated mode.'],
      },
      metadata: { mode: 'mock', reason: error.message },
    };
  }
}

async function provisionKubernetesEnvironment(labConfig, sessionId) {
  const namespace = `${labConfig.runtime.namespace}-${sessionId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  try {
    await runCommand('kubectl', ['create', 'namespace', namespace]);
    return {
      provider: 'kubernetes',
      resourceId: namespace,
      shell: {
        type: 'kubectl-exec',
        command: ['kubectl', '-n', namespace, 'exec', '-it', 'deployment/lab-target', '--', '/bin/sh'],
      },
      metadata: { namespace },
    };
  } catch (error) {
    return {
      provider: 'kubernetes',
      resourceId: randomId('mock-k8s'),
      shell: {
        type: 'simulated-shell',
        command: ['echo', 'Kubernetes cluster unavailable in this environment; running in simulated mode.'],
      },
      metadata: { mode: 'mock', reason: error.message },
    };
  }
}

async function destroyEnvironment(session) {
  if (!session?.runtimeContext) return;

  if (session.runtimeContext.provider === 'docker' && session.runtimeContext.metadata?.containerName) {
    try {
      await runCommand('docker', ['rm', '-f', session.runtimeContext.metadata.containerName]);
    } catch (error) {
      // ignore teardown errors for ephemeral labs
    }
  }

  if (session.runtimeContext.provider === 'kubernetes' && session.runtimeContext.metadata?.namespace) {
    try {
      await runCommand('kubectl', ['delete', 'namespace', session.runtimeContext.metadata.namespace, '--wait=false']);
    } catch (error) {
      // ignore teardown errors for ephemeral labs
    }
  }
}

async function provisionEnvironment(labConfig, sessionId) {
  if (labConfig.runtime?.provider === 'kubernetes') {
    return provisionKubernetesEnvironment(labConfig, sessionId);
  }

  return provisionDockerEnvironment(labConfig, sessionId);
}

module.exports = {
  provisionEnvironment,
  destroyEnvironment,
};
