import { loadEnv } from './config';
import { logger } from './logger';
import { DeploymentStore } from './store';
import { createRouter } from './routes';
import { tickStatus } from './deploy';

async function main() {
  const env = loadEnv();
  const store = new DeploymentStore();
  const router = createRouter({ env, store });

  const server = Bun.serve({
    port: env.PORT,
    idleTimeout: 0,
    fetch: router,
    error(err) {
      logger.error({ err: err.message }, 'server error');
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  logger.info(
    {
      port: server.port,
      network: env.KITE_NETWORK,
      vultr: env.VULTR_API_KEY ? 'configured' : 'not set',
      featherless: env.FEATHERLESS_API_KEY ? 'configured' : 'not set',
      kiteMcp: env.KITE_MCP_API_KEY ? 'configured' : 'not set',
    },
    'Hermes Cloud control plane up',
  );

  const pollInterval = setInterval(() => {
    tickStatus(env, store).catch((err) => {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'status tick failed',
      );
    });
  }, 10_000);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    clearInterval(pollInterval);
    try {
      server.stop();
      process.exit(0);
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, 'fatal');
  process.exit(1);
});
