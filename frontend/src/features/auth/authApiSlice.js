import { apiSlice } from '../api/apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: '/users/login',
        method: 'POST',
        body: data,
      }),
    }),
    googleLogin: builder.mutation({
      query: (data) => ({
        url: '/users/google',
        method: 'POST',
        body: data,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
    }),
    verifyOTP: builder.mutation({
      query: (data) => ({
        url: '/users/verify',
        method: 'POST',
        body: data,
      }),
    }),
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    // Mall Admin: Create a staff account pre-assigned to their mall + department
    createStaff: builder.mutation({
      query: (data) => ({
        url: '/users/staff',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    // Mall Admin: Change an existing staff member's department
    updateStaffDepartment: builder.mutation({
      query: ({ id, department }) => ({
        url: `/users/staff/${id}/department`,
        method: 'PUT',
        body: { department },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useGetUsersQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useCreateStaffMutation,
  useUpdateStaffDepartmentMutation,
} = authApiSlice;

