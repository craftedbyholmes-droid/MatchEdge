export function checkCronAuth(request) {
  return request.headers.get('authorization') === 'Bearer ' + process.env.CRON_SECRET
}