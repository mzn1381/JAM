import axios from 'axios'

type ApiErrorBody = {
  message?: string
}

export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return 'خطای غیرمنتظره ای رخ داد. لطفا دوباره تلاش کنید.'
  }

  if (!error.response) {
    return 'اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.'
  }

  const status = error.response.status
  const responseMessage = error.response.data?.message?.trim()

  if (responseMessage) {
    return responseMessage
  }

  if (status === 401) {
    return 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.'
  }

  if (status === 403) {
    return 'شما دسترسی لازم برای انجام این عملیات را ندارید.'
  }

  if (status >= 500) {
    return 'خطایی در سرور رخ داده است. لطفا بعدا تلاش کنید.'
  }

  return 'درخواست با خطا مواجه شد. لطفا دوباره تلاش کنید.'
}
