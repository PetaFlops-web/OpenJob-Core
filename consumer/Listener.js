import { publishRealtimeEvent } from "./shared/realtime.js";
import { createRealtimePayload } from "./shared/realtime.js";
import logger from "./shared/logger.js";

class Listener {
  constructor(applicationService, mailSender) {
    this._applicationService = applicationService;
    this._mailSender = mailSender;
  }

  async listen(msg) {
    try {
      const { application_id } = JSON.parse(msg.content.toString());

      const data =
        await this._applicationService.getApplicationWithJobOwner(
          application_id,
        );

      await this._mailSender.sendEmail(data.owner_email, {
        applicantEmail: data.applicant_email,
        applicantName: data.applicant_name,
        appliedAt: data.applied_at,
      });

      await publishRealtimeEvent({
        room: `user:${data.owner_id}`,
        event: "application_created",
        payload: createRealtimePayload({
          id: application_id,
          type: "application_created",
          message: "New application received",
          application_id,
          applicant_id: data.applicant_id,
          applicant_name: data.applicant_name,
          job_id: data.job_id,
          company_id: data.company_id,
        }),
      });

      await publishRealtimeEvent({
        room: `company:${data.company_id}`,
        event: "application_created",
        payload: createRealtimePayload({
          id: application_id,
          type: "application_created",
          message: "New application received",
          application_id,
          applicant_id: data.applicant_id,
          applicant_name: data.applicant_name,
          job_id: data.job_id,
          company_id: data.company_id,
        }),
      });

      logger.log(`Email notifikasi terkirim ke job owner: ${data.owner_email}`);
    } catch (error) {
      logger.error("Gagal memproses message:", error.message);
      throw error;
    }
  }
}

export default Listener;