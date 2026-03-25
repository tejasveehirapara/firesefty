import axios from 'axios';
import { getCurrentUser } from '@/utils/AuthCookie';
import { successToast } from '@/components/ui/Toast';
import { constructQueryParams } from '@/utils/ConstructQueryParams';

/* =====================================
   ROUTES
===================================== */
const UNAUTHORIZE_ROUTE = '/unauthorize';

/* =====================================
   AXIOS INSTANCE
===================================== */
const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  timeout: 20000,
  withCredentials: true, // ✅ IMPORTANT for cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

/* =====================================
   RESPONSE INTERCEPTOR
===================================== */
axiosClient.interceptors.response.use(
  response => response,
  error => {
    const message = error?.response?.data?.message;
    if (message) {
      successToast(message);
    }
    return Promise.reject(error);
  }
);

/* =====================================
   COMMON ERROR HANDLER
===================================== */
const handleApiError = (error, navigate) => {
  const status = error?.response?.status;

  if (status === 401) {
    navigate(UNAUTHORIZE_ROUTE);
  }
};

/* =====================================
   AUTH HEADER
   (If token stored in cookie object)
===================================== */
const getAuthHeader = () => {
  const user = getCurrentUser();
  return user?.token
    ? { Authorization: `Bearer ${user.token}` }
    : {};
};

/* =====================================
   RESPONSE FORMATTER
===================================== */
const successResponse = response => ({
  response,
  successType: response.data?.success,
  message: response.data?.message
});

/* =====================================
   GET
===================================== */
export const getRequest = async ({ url, params = {}, navigate }) => {
  try {
    const queryString = constructQueryParams(params);
    const finalUrl = queryString ? `${url}?${queryString}` : url;

    const response = await axiosClient.get(finalUrl, {
      headers: getAuthHeader()
    });

    return successResponse(response);
  } catch (error) {
    handleApiError(error, navigate);
    throw error;
  }
};

/* =====================================
   POST
===================================== */
export const postRequest = async ({
  url,
  payload,
  navigate,
  type = 'json'
}) => {
  try {
    const headers =
      type === 'form-data'
        ? { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        : getAuthHeader();

    const response = await axiosClient.post(url, payload, { headers });
    return successResponse(response);
  } catch (error) {
    handleApiError(error, navigate);
    throw error;
  }
};

/* =====================================
   PUT
===================================== */
export const putRequest = async ({ url, payload, navigate }) => {
  try {
    const response = await axiosClient.put(url, payload, {
      headers: getAuthHeader()
    });
    return successResponse(response);
  } catch (error) {
    handleApiError(error, navigate);
    throw error;
  }
};

/* =====================================
   PATCH
===================================== */
export const patchRequest = async ({
  url,
  payload,
  navigate,
  type = 'json'
}) => {
  try {
    const headers =
      type === 'form-data'
        ? { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        : getAuthHeader();

    const response = await axiosClient.patch(url, payload, { headers });
    return successResponse(response);
  } catch (error) {
    handleApiError(error, navigate);
    throw error;
  }
};

/* =====================================
   DELETE
===================================== */
export const deleteRequest = async ({ url, navigate }) => {
  try {
    const response = await axiosClient.delete(url, {
      headers: getAuthHeader()
    });
    return successResponse(response);
  } catch (error) {
    handleApiError(error, navigate);
    throw error;
  }
};
