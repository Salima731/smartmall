import { apiSlice } from '../api/apiSlice';

export const reviewApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: ({ targetType, targetId }) => `/reviews/${targetType}/${targetId}`,
      providesTags: ['Review'],
    }),
    getMyReviews: builder.query({
      query: () => '/reviews/myreviews',
      providesTags: ['Review'],
    }),
    getAllReviews: builder.query({
      query: () => '/reviews',
      providesTags: ['Review'],
    }),
    getAverageRating: builder.query({
      query: ({ targetType, targetId }) => `/reviews/avg/${targetType}/${targetId}`,
      providesTags: ['Review'],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: '/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review'],
    }),
    moderateReview: builder.mutation({
      query: ({ id, status }) => ({
        url: `/reviews/${id}/moderate`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Review'],
    }),
    updateReview: builder.mutation({
      query: ({ id, rating, comment }) => ({
        url: `/reviews/${id}`,
        method: 'PUT',
        body: { rating, comment },
      }),
      invalidatesTags: ['Review'],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const { 
  useGetReviewsQuery, 
  useGetMyReviewsQuery,
  useGetAllReviewsQuery,
  useGetAverageRatingQuery, 
  useCreateReviewMutation,
  useModerateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation
} = reviewApiSlice;
