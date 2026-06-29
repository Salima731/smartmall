import { apiSlice } from '../api/apiSlice';

export const mallApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMalls: builder.query({
      query: (keyword) => ({
        url: '/malls',
        params: { keyword },
      }),
      providesTags: ['Mall'],
    }),
    getNearbyMalls: builder.query({
      query: ({ lat, lng }) => ({
        url: '/malls/nearby',
        params: { lat, lng },
      }),
      providesTags: ['Mall'],
    }),
    getMallById: builder.query({
      query: (id) => `/malls/${id}`,
      providesTags: ['Mall'],
    }),
    createMall: builder.mutation({
      query: (data) => ({
        url: '/malls',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Mall'],
    }),
    updateMall: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/malls/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Mall'],
    }),
    deleteMall: builder.mutation({
      query: (id) => ({
        url: `/malls/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Mall'],
    }),
    getCrowdDensity: builder.query({
      query: (id) => `/malls/${id}/crowd-density`,
      providesTags: ['Mall'],
    }),
  }),
});

export const {
  useGetMallsQuery,
  useGetNearbyMallsQuery,
  useGetMallByIdQuery,
  useCreateMallMutation,
  useUpdateMallMutation,
  useDeleteMallMutation,
  useGetCrowdDensityQuery
} = mallApiSlice;
