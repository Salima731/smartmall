import { apiSlice } from './apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Mall', 'User', 'Shop', 'Product', 'Offer', 'Parking', 'Order', 'Restroom'],
    }),
    getAdminLogs: builder.query({
      query: ({ page, limit } = {}) => ({
        url: '/admin/logs',
        params: { page, limit },
      }),
      providesTags: ['User'], // We can refresh when user actions happen
    }),
    getAdminSettings: builder.query({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),
    updateAdminSettings: builder.mutation({
      query: (data) => ({
        url: '/admin/settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
    sendAnnouncement: builder.mutation({
      query: (data) => ({
        url: '/admin/announcements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alert', 'Notification'],
    }),
    assignMallAdmin: builder.mutation({
      query: (data) => ({
        url: '/admin/assign-mall-admin',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Mall', 'User'],
    }),
    updateMallStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/admin/malls/${id}/status`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Mall'],
    }),
    updateShopStatus: builder.mutation({
      query: ({ id, status, isFeatured }) => ({
        url: `/admin/shops/${id}/status`,
        method: 'PUT',
        body: { status, isFeatured },
      }),
      invalidatesTags: ['Shop'],
    }),
    updateProductStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/products/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Product'],
    }),
    updateOfferStatus: builder.mutation({
      query: ({ id, status, isFeatured }) => ({
        url: `/admin/offers/${id}/status`,
        method: 'PUT',
        body: { status, isFeatured },
      }),
      invalidatesTags: ['Offer'],
    }),
    getMonitoringOps: builder.query({
      query: () => '/admin/monitoring',
      providesTags: ['Parking', 'Order', 'Restroom', 'User'],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminLogsQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useSendAnnouncementMutation,
  useAssignMallAdminMutation,
  useUpdateMallStatusMutation,
  useUpdateShopStatusMutation,
  useUpdateProductStatusMutation,
  useUpdateOfferStatusMutation,
  useGetMonitoringOpsQuery,
} = adminApiSlice;
