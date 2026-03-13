// Utility functions for pagination
export const parsePagination = (response) => {
    // DRF pagination format
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return {
            items: response.data.results,
            count: response.data.count || response.data.results.length,
            next: response.data.next,
            previous: response.data.previous,
            pageSize: response.data.results.length,
            currentPage: getPageFromUrl(response.data.next) - 1 || getPageFromUrl(response.data.previous) + 1 || 1,
        };
    }
    // Non-paginated response
    return {
        items: Array.isArray(response.data) ? response.data : [],
        count: Array.isArray(response.data) ? response.data.length : 0,
        next: null,
        previous: null,
        pageSize: Array.isArray(response.data) ? response.data.length : 0,
        currentPage: 1,
    };
};

const getPageFromUrl = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? parseInt(match[1]) : null;
};

export const buildPaginationParams = (page = 1, pageSize = 20, search = '', ordering = '') => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page);
    if (pageSize !== 20) params.append('page_size', pageSize);
    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);
    return params.toString();
};

