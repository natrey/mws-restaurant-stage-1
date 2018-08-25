let restaurant;
var map;

import DBHelper from './utils/dbhelper';

import { IMAGE } from './utils/constants';

/**
 * Service worker registration
 */
const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('sw.js').then(reg => {
    console.log('Registration worked!');
  }).catch(err => {
    console.log('Registration failed!');
  });
};

document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.querySelector('.map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false,
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.getRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.querySelector('.restaurant__name');
  name.innerHTML = restaurant.name;

  const address = document.querySelector('.restaurant__address');
  address.innerHTML = restaurant.address;

  const image = document.querySelector('.restaurant__img');
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Interior design of ${restaurant.name} Restaurant.`;

  image.srcset = DBHelper.adaptiveImageForRestaurant(restaurant) + ` ${IMAGE.SMALL_WIDTH}`;
  image.sizes = IMAGE.SIZES;

  const source = document.querySelector('.restaurant source');
  source.srcset = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.querySelector('.restaurant__cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.querySelector('.restaurant__hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (restaurant = self.restaurant) => {
  DBHelper.fetchRestaurantReviews(restaurant.id, (error, reviews) => {
    const container = document.querySelector('.reviews__container');
    const formContainer = document.querySelector('.add-review');
    const title = document.createElement('h3');
    title.className = 'reviews__title';
    title.innerHTML = 'Reviews';
    container.insertBefore(title, formContainer);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.insertBefore(noReviews, formContainer);
      return;
    }
    const ul = document.querySelector('.reviews__list');
    reviews.forEach(review => {
      ul.append(createReviewHTML(review));
    });
    container.insertBefore(ul, formContainer);
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.className = 'reviews-item';

  const header = document.createElement('header');
  header.className = 'reviews-item__header';
  li.appendChild(header);

  const name = document.createElement('div');
  name.innerHTML = review.name;
  name.className = 'reviews-item__name';
  header.appendChild(name);

  const dateObj = new Date(review.createdAt);
  const formatedDate = `${dateObj.getDate()}.${dateObj.getMonth()}.${dateObj.getFullYear()}`;

  const date = document.createElement('div');
  date.innerHTML = formatedDate;
  date.className = 'reviews-item__date';
  header.appendChild(date);

  const rating = document.createElement('div');
  rating.className = 'reviews-item__rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add new review
 */

document.querySelector('.add-review__form').addEventListener('submit', e => {
  e.preventDefault();
  const formElements = e.target.elements;

  const formData = {
    restaurant_id: self.restaurant.id,
    name: formElements.namedItem('author').value,
    rating: formElements.namedItem('rating').value,
    comments: formElements.namedItem('comments').value
  };

  DBHelper.postRestaurantReview(formData, (error, review) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      console.log(review);
    }
  });
});

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.querySelector('.breadcrumb ul');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
