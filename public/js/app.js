'use strict';

$('.select-button').on('click', function () {
  $(this).next().toggleClass('hide-me');
});
