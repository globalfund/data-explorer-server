import axios from 'axios';

type ReportBody = {
  reportId: string;
  reportName: string;
  errorMessage: string;
  details: string;
  action: string;
  userId: string;
};

function escapeSlackMarkdown(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function composeSlackMessage(body: ReportBody) {
  const reportName = escapeSlackMarkdown(body.reportName);
  const reportId = escapeSlackMarkdown(body.reportId);
  const userId = escapeSlackMarkdown(body.userId);
  const errorMessage = escapeSlackMarkdown(body.errorMessage);
  const details = escapeSlackMarkdown(body.details);
  const action = escapeSlackMarkdown(body.action);

  return {
    // Fallback text used by notifications and accessibility tools.
    text: `Report failed: ${body.reportName} (${body.reportId})`,

    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Report Error',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Report Name:*\n${reportName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Report ID:*\n\`${reportId}\``,
          },
          {
            type: 'mrkdwn',
            text: `*User ID:*\n\`${userId}\``,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error Message:*\n\`\`\`${errorMessage.slice(0, 2_500)}\`\`\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n${details.slice(0, 2_500)}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*User Action:*\n${action.slice(0, 1_500)}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Reported at ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  };
}

export const sendErrorReportToSlack = async (body: ReportBody) => {
  const slackWebhookUrl = process.env.ERROR_REPORT_SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    console.error(
      'Slack webhook URL is not defined in the environment variables.',
    );
    return;
  }
  const payload = composeSlackMessage(body);

  try {
    await axios.post(slackWebhookUrl, payload, {
      headers: {'Content-Type': 'application/json'},
    });
  } catch (err) {
    console.error('Failed to send error report to Slack:', err);
  }
};
