'use strict';

$('.select-button').on('click', function () {
  $(this).next().toggleClass('hide-me');
});

$('.update-button').on('click', function () {
  $(this).next().toggleClass('hide-me');
});
