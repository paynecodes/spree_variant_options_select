(function ($, window, document, undefined) {
    'use strict';

    // attach the .compare method to Array's prototype to call it on any array
    Array.prototype.compare = function (array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time
        if (this.length != array.length)
            return false;

        for (var i = 0, l=this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].compare(array[i]))
                    return false;
            }
            else if (this[i] != array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    };

    var $add_to_cart = [],
          $groups = [],
          $variant_input = [],
          $thumbs = [],
          $main_image = [],
          variant_matrix = [];

    $(document).ready(function() {
        $add_to_cart = $('#add-to-cart-button');
        $groups = $('.variant-option-values');
        $variant_input = $('#variant_id');
        $thumbs = $('#product-thumbnails li');
        $main_image = $('#main-image');

        if ($groups.length) {
            disableButton($add_to_cart);
            setupClickHandler($groups);

            $groups.each(function(i, item) {
                var $item = $(item);
                $groups[i].$options = $item.find('.option-value');
            });
        }
    });

    // Setup a delegated event, listening on the '$group' for '.option-value' clicks
    function setupClickHandler($elem) {
        $elem.on('click', '.option-value', handleOptionClick);
    }

    function handleOptionClick(e) {
        var $target = $(e.target),
              group_index = $target.data('group');

        // Cancel the click if $target is out of stock
        if ($target.hasClass('out-of-stock')) return false;

        // See if the button was already 'active'
        if ($target.hasClass('active')) {
            // Deactivate the clicked button
            deactivateButton($target);
            // Disable the next option value group
            disableNextGroup(group_index);
            // Remove from the variant_matrix
            removeFromMatrix(group_index);
        } else {
            // Deactivate all buttons in the group
            deactivateButton($groups[group_index].$options);
            // Activate only the button that was clicked
            activateButton($target);
            // Add to the variant_matrix
            addToMatrix($target, group_index);
            // Enable the next option value group.
            // enableNextGroup function will handle whether or not there is another group
            enableNextGroup(group_index);
        }

        // On every option value click, we checkout to see if all the options
        // have been clicked.
        // If so, add the common variant_id to the hidden input, and
        // enable the add to cart button.
        // If not, disable the add to cart button, and remove the
        // hidden input value.
        if (variant_matrix.length === $groups.length) {
            var common_id = getCommonMatrixId(variant_matrix);
            updateVariantInput(common_id);
            findPhoto(common_id);
            enableButton($add_to_cart);
        } else {
            updateVariantInput('');
            disableButton($add_to_cart);
        }
    }

    function enableNextGroup(current_index) {
        var new_index = current_index + 1,
              $next_group = $groups[new_index],
              keep_in_matrix = false;

        // If there is a '$next_group'
        if (typeof $next_group !== 'undefined') {
            var $options = $next_group.$options;

            for (var i=0; i < $options.length; i++) {
                var $current_option = $options.eq(i);
                var current_option_products = $current_option.data('products');
                var common_id = getCommonMatrixId([ current_option_products, variant_matrix[current_index] ]);

                if ( common_id.length ) {
                    enableButton($current_option);
                    if (current_option_products.compare(variant_matrix[new_index])) {
                        keep_in_matrix = true;
                    }
                }
                else {
                    disableButton($current_option);
                    deactivateButton($current_option);
                }
            }

            if (!keep_in_matrix) removeFromMatrix(new_index);

        } else return;
    }

    function disableNextGroup(current_index) {
        var new_index = current_index + 1,
              $next_group = $groups[new_index];

        // If there is a '$next_group'
        if (typeof $next_group !== 'undefined') {
            var $options = $next_group.$options;
            removeFromMatrix(new_index);
            deactivateButton($options);
            disableButton($options);
        } else return;
    }

    function getCommonMatrixId(array_ids) {
        var first_common = null,
              common = [];

        if (array_ids.length >= 2) {
            for (var i=1; i < array_ids.length; i++) {
                if (first_common !== null) {
                    common = intersection(array_ids[i], common);
                } else {
                    first_common = intersection(array_ids[i], array_ids[i-1]);
                    common = first_common;
                }
            }
        } else common = array_ids[0];

        return common;
    }

    function addToMatrix($elem, index) {
        variant_matrix[index] = $elem.data('products');
    }

    function removeFromMatrix(index) {
        variant_matrix.splice(index, 1);
    }

    function activateButton($elem) {
        $elem.addClass('active');
    }

    function deactivateButton($elem) {
        $elem.removeClass('active');
    }

    function enableButton($elem) {
        $elem.prop('disabled', false);
    }

    function disableButton($elem) {
        $elem.prop('disabled', true);
    }

    function updateVariantInput(variant_id) {
        $variant_input.val(variant_id);
    }

    function findPhoto(variant_id) {
        var $current = [],
              url = "";

        $current = $thumbs.filter('.tmb-'+variant_id).eq(0);
        if ($current.length) {
            url = $current.find('a').attr('href');
            changeMainImage(url);
            changeSelectedThumbnail($current);
        }
    }

    function changeMainImage(url) {
        $main_image.find('img').attr('src', url);
    }

    function changeSelectedThumbnail($tmb) {
        $thumbs.removeClass('selected');
        $tmb.addClass('selected');
    }

    // Utils

    // Find the intersection of two arrays
    // Adopted from the following jsperf
    // http://jsperf.com/array-intersection-unsorted
    function intersection(a, b) {
        var intersection = [];
        var as = a.slice(0).sort(compareNumbers);
        var bs = b.slice(0).sort(compareNumbers);

        var i = 0,
             j = 0;

        while (i < as.length && j < bs.length) {
            if (as[i] === bs[j]) {
                intersection.push(as[i]);
                i++;
                j++;
            } else if (as[i] > bs[j]) {
                j++;
            } else {
                i++;
            }
        }

        return intersection;
    }

    // for the sorting
    function compareNumbers(a, b) {
        return a - b;
    }

    // Flatten an array
    // http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript#comment14154801_10865025
    function flatten(arr) {
        return $.map(arr, function (i) { return i });
    }

}(jQuery, this, this.document));