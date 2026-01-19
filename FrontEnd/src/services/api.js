const API_BASE_URL = 'https://api.davidas.pro/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login successful:', data);
    
    // Save token if provided
    if (data.token) {
      localStorage.setItem('token', data.token);
    } else if (data.data && data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'GET',
      credentials: 'include', // Use cookies for authentication
    });

    // Clear local storage and cookies regardless of response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    // Clear JWT cookie
    document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    if (!response.ok) {
      console.warn('Logout API call failed, but local data cleared');
    } else {
      console.log('x Logout successful');
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage and cookies even if API fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const fetchListings = async (searchQuery = '') => {
  try {
    const url = searchQuery 
      ? `${API_BASE_URL}/list?search=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/list`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('x API Response:', data);
    return data.data.listings;
  } catch (error) {
    console.error('x Error fetching listings:', error);
    throw error;
  }
};

// Favorites API
export const addToFavorites = async (listingId) => {
  try {
    console.log(' Sending to favorites:', { listingId });
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ listingId }),
    });

    console.log(' Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('x Error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('x Added to favorites:', data);
    return data;
  } catch (error) {
    console.error('x Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (listingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('x Removed from favorites:', data);
    return data;
  } catch (error) {
    console.error('x Error removing from favorites:', error);
    throw error;
  }
};

export const getFavorites = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('x Favorites fetched:', data);
    return data.data.favorites;
  } catch (error) {
    console.error('x Error fetching favorites:', error);
    throw error;
  }
};

export const checkFavorite = async (listingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites/${listingId}/check`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.isFavorite;
  } catch (error) {
    console.error('x Error checking favorite:', error);
    return false;
  }
};

export const registerUser = async (email, password, firstName, lastName, role = 'buyer') => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Register successful:', data);
    
    // Save token if provided
    if (data.token) {
      localStorage.setItem('token', data.token);
    } else if (data.data && data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const addToCart = async (listingId, quantity = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ listingId, quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Added to cart:', data);
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

export const getCart = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Cart fetched:', data);
    return data.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

export const removeFromCart = async (listingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${listingId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Removed from cart:', data);
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

export const updateCartItem = async (listingId, quantity) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${listingId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Updated cart item:', data);
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};
