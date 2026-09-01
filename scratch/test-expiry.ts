import 'dotenv/config';
import { membershipExpiryJob } from '../src/lib/jobs/tasks/membership-expiry.job';

async function test() {
  console.log("Running expiry job...");
  try {
    await membershipExpiryJob.execute();
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
