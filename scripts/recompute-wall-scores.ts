/**
 * Backfill script: recomputes wallScore for all barbers.
 * Run once after deploying the add_wall_score migration (e.g. locally or in CI).
 *
 * Usage: npx ts-node scripts/recompute-wall-scores.ts
 * Or:    npm run recompute-wall-scores
 *
 * In production: use the admin endpoint instead (no ts-node needed):
 *   POST /api/barbers/admin/recompute-wall-scores
 *   Header: Authorization: Bearer <admin_jwt>
 */

import barberService from '../src/services/barber.service';

async function main() {
  console.log('Recomputing wall scores for all barbers...');
  await barberService.recomputeAllWallScores();
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
