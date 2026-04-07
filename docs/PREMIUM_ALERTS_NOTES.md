# Premium alerts notes

This patch upgrades the alerts page into a Premium feature with:
- Premium+ gating
- sport filters
- minimum profit %
- strategy mode
- trigger type
- digest / frequency mode
- cooldown minutes
- kickoff window hours
- bookmaker include/exclude lists
- in-app / email / sms delivery toggles
- user-only contact preferences
- quiet hours
- alert delivery history

Suggested SMS provider for later live integration:
- Twilio

Suggested env placeholders to add to .env.local when you wire SMS:
- TWILIO_ACCOUNT_SID=
- TWILIO_AUTH_TOKEN=
- TWILIO_FROM_NUMBER=

This patch scaffolds the rules and contact-preferences layer. It does not yet send live SMS or email.