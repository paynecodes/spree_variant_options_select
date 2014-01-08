(function ($, window, document, undefined) {
    'use strict';

    // Utils

    // Find the intersection of two arrays
    function intersection(a, b) {
      var ai=0, bi=0;
      var result = new Array();

      while( ai < a.length && bi < b.length ) {
         if (a[ai] < b[bi] ){ ai++; }
         else if (a[ai] > b[bi] ){ bi++; }
         else {
           result.push(a[ai]);
           ai++;
           bi++;
         }
      }

      return result;
    }

    // Flatten an array
    // http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript#comment14154801_10865025
    function flatten(arr) {
        return $.map(arr, function (i) { return i });
    }

    var $group = [],
          $thumbs = [],
          $main_image = [],
          $variant_input = [],
          $add_to_cart = [],
          variantMatrix = [];

    $(document).ready(function() {

        $group = $('.variant-option-values'),
        $thumbs = $('#product-thumbnails li'),
        $main_image = $('#main-image'),
        $variant_input = $('#variant_id');
        $add_to_cart = $('#add-to-cart-button');

        if ($group.length) {
            disableButton($add_to_cart);

            $group.each(function(i, item) {
                var $item = $(item);
                $group[i].$options = $item.find('.option-value');
                setupClickHandler($group[i].$options);
            });
        }

    });

    function setupClickHandler($elem) {
        $elem.on('click', handleOptionValueClick);
    }

    function handleOptionValueClick(e) {
        var $this = $(this);
        var group_index = $this.data('group');

        if ($this.hasClass('active')) {
            var groups_count = $group.length;
            deactivateButton($this, group_index);
            updateMatrix($this, group_index, true);
            for (var i = group_index  + 1; i < groups_count; i++) {
                updateMatrix($this, i - 1, true);
                deactivateButton($group[i].$options, group_index);
                disableButton($group[i].$options);
            }
        } else {
            deactivateButton($group[group_index].$options, group_index);
            activateButton($this, group_index);
            updateMatrix($this, group_index, false);
            enableNextGroup( group_index + 1 );
        }
    }

    function enableNextGroup(enable_index) {
        var $nextGroup = [],
              flatVariants;

        $nextGroup = $group[enable_index];
        if (typeof $nextGroup !== 'undefined') {
            enableButton($nextGroup.$options);
            flatVariants = flatten(variantMatrix);
            checkAvailability(enable_index, flatVariants);
        }
    }

    function checkAvailability(group_index, variant_ids) {
        $group[group_index].$options.each(function(i, elem) {
            var $elem = $(elem);
            var intersect = intersection($elem.data('products'), variant_ids);
            if (intersect.length) enableButton($elem);
            else disableButton($elem);
        });
    }

    function activateButton($btn, group_index) {
        $btn.addClass('active');
    }

    function deactivateButton($btn, group_index) {
        $btn.removeClass('active');
    }

    function updateMatrix($elem, group_index, remove) {
        var common_variant_id = false;

        if (typeof remove == 'undefined' || remove === false) {
            variantMatrix[group_index] = $elem.data('products');
        } else variantMatrix.splice(group_index, 1);

        // If the matrix contains all the values it needs,
        // find the common variant id, update the photo, and update the hidden input
        if (variantMatrix.length === $group.length) {
            common_variant_id = getCommonMatrixId();
            findPhoto(common_variant_id);
            updateVariantInput(common_variant_id);
        }

        updateAddToCartButton(common_variant_id);
    }

    function getCommonMatrixId() {
        var intersect;

        if (variantMatrix.length > 1) {
            for (var i = 1; i < variantMatrix.length; i++) {
                intersect = intersection(variantMatrix[i-1], variantMatrix[i]);
            }
        } else intersect = variantMatrix;

        return intersect[0];
    }

    function updateAddToCartButton(common_variant_id) {
        if (common_variant_id) enableButton($add_to_cart);
        else disableButton($add_to_cart);
    }

    function enableButton($btn) {
        $btn.prop('disabled', false);
    }

    function disableButton($btn) {
        $btn.prop('disabled', true);
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

    function updateVariantInput(variant_id) {
        $variant_input.val(variant_id);
    }

}(jQuery, this, this.document));