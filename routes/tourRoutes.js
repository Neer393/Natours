const express = require('express');
const tourController = require('./../controllers/tourController.js');
const authController = require('./../controllers/authController.js');
const reviewRouter = require('./reviewRoutes.js');

const router = express.Router();

// This is done so that any route with url /tours/4hhfiu4h3/reviews end up going to reviews
router.use('/:tourId/reviews',reviewRouter);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTours,tourController.getAllTours);

router
  .route('/get-tour-stats')
  .get(tourController.getTourStats);

router
  .route('/')
  .get(authController.protect,tourController.getAllTours)
  .post(authController.protect,authController.restrictTo('admin'),tourController.createTour);

router
  .route('/:id')
  .get(authController.protect,tourController.getTour)
  .patch(authController.protect,authController.restrictTo('admin'),tourController.updateTour)
  .delete(authController.protect,authController.restrictTo('admin'),tourController.deleteTour);

module.exports = router;