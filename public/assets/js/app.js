/**
 * Utillities
 */
// Debounce
const debounce = function (func, wait, immediate) {

    var timeout

    return function () {

        var context = this, args = arguments;

        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args)
        }

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait)

        if (callNow) func.apply(context, args)
    }
}

// Customize jQuery serializeArray()
var originalSerializeArray = $.fn.serializeArray;

$.fn.extend({
    serializeArray: function () {
        var brokenSerialization = originalSerializeArray.apply(this);
        var checkboxValues = $(this).find('input[type=checkbox]').map(function () {
            var val = (this.checked) ? 'Yes' : 'No'
            return { 'name': this.name, 'value': val };
        }).get();
        var checkboxKeys = $.map(checkboxValues, function (element) { return element.name; });
        var withoutCheckboxes = $.grep(brokenSerialization, function (element) {
            return $.inArray(element.name, checkboxKeys) == -1;
        });

        return $.merge(withoutCheckboxes, checkboxValues);
    }
})

// Append shop param in each ajax
$.ajaxPrefilter(function (options) {
    options.url += ((options.url.indexOf('?') < 0) ? '?' : '&') + 'shop=' + window.current_shop;
})

/**
 * Tab
 */
$('.card-section > div').hide()
$('.card-section > div:first').show()

$('.tabs li:first').addClass('active')

$('.tabs li > a').on('click', function (e) {

    e.preventDefault()

    var target = $(this).attr('data-target')

    $('.tabs li').removeClass('active')
    $(this).parent('li').addClass('active')

    $('.card-section > div').hide()
    $('.card-section > div' + target).fadeIn('fast')
})


/**
 * Products & Collections Grid
 */
// Show empty results
var show_empty_results = function (type) {

    if (type == 'product') {
        $('#product-card table, #product-card .pagination').hide()
        $('#product-card .empty-search-results').show()
    } else {
        $('#collection-card table, #collection-card .pagination').hide()
        $('#collection-card .empty-search-results').show()
    }
}

// Show loading information
var show_loading = function (type) {

    if (type == 'product') {
        $('#product-card table').show()
        $('#product-card .empty-search-results, #product-card .pagination').hide()
        $('#product-card table tbody').html('<tr><td colspan="6" class="align-center">Loading data...</td></tr>')
    } else {
        $('#collection-card table').show()
        $('#collection-card .empty-search-results, #collection-card .pagination').hide()
        $('#collection-card table tbody').html('<tr><td colspan="5" class="align-center">Loading data...</td></tr>')
    }
}

// Decide to display pagination
var decide_pagination = function (type, page, total) {

    if (type == 'product') {
        var target = $('#product-card .pagination')
    } else {
        var target = $('#collection-card .pagination')
    }

    if (total > 50) {

        var total_displayed = page * 50

        // Next page
        if (total_displayed < total) {
            target.find('button.icon-arrow-right').removeAttr('disabled')
            target.find('button.icon-arrow-right').attr('data-next-page', (parseInt(page) + 1))
        } else {
            target.find('button.icon-arrow-right').attr('disabled', 'disabled')
            target.find('button.icon-arrow-left').removeAttr('data-next-page')
        }

        // Prev page
        if (page > 1) {
            target.find('button.icon-arrow-left').removeAttr('disabled')
            target.find('button.icon-arrow-left').attr('data-prev-page', (parseInt(page) - 1))
        } else {
            target.find('button.icon-arrow-left').attr('disabled', 'disabled')
            target.find('button.icon-arrow-left').removeAttr('data-prev-page')
        }

        target.show()

    } else {

        if (type == 'product') {
            target.hide()
        } else {
            target.hide()
        }
    }
}

// Product template
var product_template = function (products) {

    if (!products.length) {
        return ''
    }

    var output = ''

    products.forEach(function (product) {

        if (product.image) {
            var image = `<img src="${product.image.src}" width="50" />`
        } else {
            var image = `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="50"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`
        }

        output += `<tr>
                      <td width="20"><a href="#" data-show-product-modal data-product-id="${product.id}">${image}</a></td>
                      <td><a href="#" data-show-product-modal data-product-id="${product.id}">${product.title}</a></td>
                      <td>${product.vendor}</td>
                      <td>${product.productType}</td>
                      <td><span class="tag grey">${product.tags}</span></td>
                      <td class="align-center"><button class="secondary icon-product" data-show-product-options-modal data-product-id="${product.id}"></button></td>
                    </tr>`
    })

    return output
}

// Collection template
var collection_template = function (collections) {

    if (!collections.length) {
        return ''
    }

    var output = ''

    collections.forEach(function (collection) {

        if (collection.image) {
            var image = `<img src="${collection.image.src}" width="50" />`
        } else {
            var image = `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="50"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`
        }

        if (collection.rules.length) {

            var rules = ''
            collection.rules.forEach(function (rule) {

                if (rule) {
                    rules += '<span class="tag grey">' + rule.column + ':' + rule.condition + '</span>'
                }
            })

        } else {
            var rules = ''
        }

        if (collection.disjunctive) {
            var condition = '<span class="tag orange">OR</span>'
        } else {
            var condition = '<span class="tag green">AND</span>'
        }

        output += `<tr>
                      <td width="20">${image}</td>
                      <td>${collection.title}</td>
                      <td>${rules}</td>
                      <td>${condition}</td>
                      <td class="align-center"><button class="secondary icon-refresh" data-collection-id="${collection.id}"></button></td>
                    </tr>`
    })

    return output
}

// Load data
var load_data = function (type, query = '', page = 1) {

    show_loading(type)

    $
        .ajax({
            url: '/api/' + type + 's/' + page + '/' + query,
            method: 'GET'
        })
        .done(function (data) {

            if (data.total < 1) {
                show_empty_results(type)
            } else {

                if (type == 'product') {
                    var shopify_data = product_template(data.products)
                } else {
                    var shopify_data = collection_template(data.collections)
                }

                $('#' + type + '-card table tbody').html(shopify_data)

                decide_pagination(type, page, data.total)

            }
        })
}

// Load data at page load 
// load_data( 'product' ) // Disabled to use Algolia, client wants to search by metafields, which is not supported by Shopify 
// load_data( 'collection' ) // Disabled to use Algolia, due to Shopify API

// Search data
$('.card-section > div > input[type="search"]').on('input', debounce(function () {

    var parent_id = $(this).parent('div').attr('id')
    var type = (parent_id == 'product-card') ? 'product' : 'collection'

    var query = $(this).val()
    load_data(type, query, 1)

}, 500))

// Data pagination
$('.card-section > div .pagination button').on('click', function () {

    if ($(this).attr('disabled') != 'disabled') {

        var parent_id = $(this).parents('.pagination').parent('div').attr('id')
        var type = (parent_id == 'product-card') ? 'product' : 'collection'

        var page = ($(this).hasClass('icon-arrow-right')) ? $(this).attr('data-next-page') : $(this).attr('data-prev-page')
        var query = $('#' + parent_id + ' input[type="search"]').val()

        load_data(type, query, page)
    }
})


/**
 * Product Modal
 */
// Show modal loading
var show_modal_loading = function (modal_container) {
    modal_container.empty().html('<img src="/assets/img/loading.gif" />')
}

// Get metafield value
var get_metafield_value = function (metafields, namespace, key) {

    var metafield = metafields.find(function (metafield) {
        return (metafield.namespace == namespace && metafield.key == key)
    })

    if (!metafield) {
        return ''
    }

    return metafield.value.replace(/"/g, '&quot;')
}

// Product modal template
var product_modal_template = function (product, metafields) {

    if (!product) {
        return ''
    }

    var output = `
            <main class="modal__content align-left" id="modal-product-content">
                <h2 id="modal-product-title" class="align-center">
                    ${product.title}
                </h2>
                <br/>
                <form id="product-form">
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Discontinued </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="disco_product" ${((get_metafield_value(metafields, 'global', 'disco_product') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Allow to Quote </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="allowed_to_quotemode" ${((get_metafield_value(metafields, 'global', 'allowed_to_quotemode') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Clearance </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="clearance" ${((get_metafield_value(metafields, 'global', 'clearance') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Special Deals </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="web_special" ${((get_metafield_value(metafields, 'global', 'web_special') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Battery Operated </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="battery" ${((get_metafield_value(metafields, 'global', 'battery') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Wireless Control </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="wireless_control" ${((get_metafield_value(metafields, 'global', 'wireless_control') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Oversized </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="oversized" ${((get_metafield_value(metafields, 'global', 'oversized') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Apply MAP </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="msrp_enabled" ${((get_metafield_value(metafields, 'global', 'msrp_enabled') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Free Shipping </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="free_shipping" ${((get_metafield_value(metafields, 'global', 'free_shipping') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Eligible Free Shipping Orders Over $299 </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="checkbox" name="free_ship_discount" ${((get_metafield_value(metafields, 'global', 'free_ship_discount') == 'Yes') ? 'checked="checked"' : '')}>Yes</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>SKU </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="sku" value="${get_metafield_value(metafields, 'global', 'sku')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>MFR </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="mfr" value="${get_metafield_value(metafields, 'global', 'mfr')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>UPC </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="upc" value="${get_metafield_value(metafields, 'global', 'upc')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>MSRP </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="msrp" value="${get_metafield_value(metafields, 'global', 'msrp')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Finish </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="finish_color" value="${get_metafield_value(metafields, 'global', 'finish_color')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>LED Array </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="led_array" value="${get_metafield_value(metafields, 'global', 'led_array')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Light Source </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="light_type" value="${get_metafield_value(metafields, 'global', 'light_type')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Mounting </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="mount_version" value="${get_metafield_value(metafields, 'global', 'mount_version')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Projection Distance </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="projection_distance" value="${get_metafield_value(metafields, 'global', 'projection_distance')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Lens Barrel </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="lens_barrel" value="${get_metafield_value(metafields, 'global', 'lens_barrel')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>PAR Lamp </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="par_can_size" value="${get_metafield_value(metafields, 'global', 'par_can_size')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Base Color </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="base_color" value="${get_metafield_value(metafields, 'global', 'base_color')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Base Size </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="base_size" value="${get_metafield_value(metafields, 'global', 'base_size')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Base Style </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="base_style" value="${get_metafield_value(metafields, 'global', 'base_style')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Base Type </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="base_type" value="${get_metafield_value(metafields, 'global', 'base_type')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Connector </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="xlr_connector" value="${get_metafield_value(metafields, 'global', 'xlr_connector')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Drape Support Style </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="drape_style" value="${get_metafield_value(metafields, 'global', 'drape_style')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Upright Type </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="uprights_type" value="${get_metafield_value(metafields, 'global', 'uprights_type')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Upright Diameter </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="uprights_size" value="${get_metafield_value(metafields, 'global', 'uprights_size')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Upright Style </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="uprights_length" value="${get_metafield_value(metafields, 'global', 'uprights_length')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Upright Color </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="upright_color" value="${get_metafield_value(metafields, 'global', 'upright_color')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Truss Style </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="truss_style" value="${get_metafield_value(metafields, 'global', 'truss_style')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Truss Type </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="truss_type" value="${get_metafield_value(metafields, 'global', 'truss_type')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Electrical </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="outdoor" value="${get_metafield_value(metafields, 'global', 'outdoor')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Fixture Type </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="stage_lighting_package_type" value="${get_metafield_value(metafields, 'global', 'stage_lighting_package_type')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Lamp Voltage </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="lamp_voltage" value="${get_metafield_value(metafields, 'global', 'lamp_voltage')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Wattage </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="lamp_wattage" value="${get_metafield_value(metafields, 'global', 'lamp_wattage')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Gobo Style </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="gobo_style" value="${get_metafield_value(metafields, 'global', 'gobo_style')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Gobo Color </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="gobo_color_style" value="${get_metafield_value(metafields, 'global', 'gobo_color_style')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>CRI </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="lamp_cri" value="${get_metafield_value(metafields, 'global', 'lamp_cri')}" /></label>
                                </div>
                            </div>
                        </div>
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Channels </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="dimmerchannel" value="${get_metafield_value(metafields, 'global', 'dimmerchannel')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column one-half">
                            <div class="row side-elements">
                                <div class="column five">
                                    <label><strong>Gel Color </strong></label>
                                </div>
                                <div class="column seven">
                                    <label><input type="text" name="gelcolor" value="${get_metafield_value(metafields, 'global', 'gelcolor')}" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column twelve">
                            <div class="row">
                                <label class="mb10"><strong>Product Highlights</strong></label>
                                <textarea rows="10" name="short_description" id="summernote">${get_metafield_value(metafields, 'global', 'short_description')}</textarea>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column twelve">
                            <div class="row">
                                <label><strong>Cross Sell Products</strong></label>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="columns five stretch">
                            <div class="row">
                                <input type="search" class="cross_sell_search" placeholder="Search products" />
                                <ul class="cross_sell_products product-list-container">
                                    <li class="loading-data">Loading data...</li>
                                </ul>
                            </div>
                        </div>
                        <div class="columns one align-center">
                            <button class="secondary icon-move-horizontal" disabled="disabled"></button>
                        </div>
                        <div class="columns five stretch">
                            <div class="row">
                                <textarea style="display:none" rows="5" name="cross_sell_products">${get_metafield_value(metafields, 'global', 'cross_sell_products')}</textarea>
                                <ul class="cross_sell_products product-list-container-receiver"></ul>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="column twelve">
                            <div class="row">
                                <label><strong>Up Sell Products</strong></label>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="columns five stretch">
                            <div class="row">
                                <input type="search" class="up_sell_search" placeholder="Search products" />
                                <ul class="up_sell_products product-list-container">
                                    <li class="loading-data">Loading data...</li>
                                </ul>
                            </div>
                        </div>
                        <div class="columns one align-center">
                            <button class="secondary icon-move-horizontal" disabled="disabled"></button>
                        </div>
                        <div class="columns five stretch">
                            <div class="row">
                                <textarea style="display:none" rows="5" name="up_sell_products">${get_metafield_value(metafields, 'global', 'up_sell_products')}</textarea>
                                <ul class="up_sell_products product-list-container-receiver"></ul>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
            <footer class="modal__footer">
                <img class="save-product-loading" src="/assets/img/loading.gif" style="display:none">
                <button data-save-product data-product-id="${product.id}">Save</button>
                <button class="secondary" data-micromodal-close aria-label="Close this dialog window">Cancel</button>
                <div class="save-result-container"></div>
            </footer>`

    return output
}

window.next_page = []

// Load data for cross/up sell
var load_data_related = function (target, query = '', page = 1, append = false) {

    var target_hash = btoa(target)

    if ($(target).attr('data-loading') == 'true') {
        return
    }

    if (append) {

        if (!$(target).find('.loading-data').length) {
            $(target).append('<li class="loading-data">Loading data...</li>')
        }
    } else {
        $(target).html('<li class="loading-data">Loading data...</li>')
    }

    $(target).attr('data-page', page)
    $(target).attr('data-loading', 'true')

    var next_page_cursor = (window.next_page[target_hash]) ? window.next_page[target_hash] : ''

    $
        .ajax({
            url: '/api/products/' + page + '/' + query + '?next_page=' + next_page_cursor,
            method: 'GET'
        })
        .done(function (data) {

            window.next_page[target_hash] = data.next_page

            if (append && data.products < 1) {
                $(target).find('.loading-data').text('No data to load anymore.')
                $(target).attr('data-loading', 'false')
                return
            }

            if (data.total < 1) {

                if (append) {
                    $(target).find('.loading-data').text('No data to load anymore.')
                } else {
                    $(target).html('<li>No data found</li>')
                }
            } else {

                var output = ''

                data.products.forEach(function (product) {

                    if (product.image) {
                        var image = `<img src="${product.image.src}" width="30" />`
                    } else {
                        var image = `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="30"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`
                    }

                    output += '<li data-handle="' + product.handle + '"><span>' + image + '</span> <span>' + product.title + '</span></li>'
                })


                if (append) {
                    $(target).find('.loading-data').remove()
                    $(target).append(output)
                } else {
                    $(target).html(output)
                }
            }

            $(target).attr('data-loading', 'false')
        })
}

// Process cross/upp sell
var process_related = function () {

    // Load initial products
    load_data_related('#modal-product ul.cross_sell_products.product-list-container')
    load_data_related('#modal-product ul.up_sell_products.product-list-container')

    $('#modal-product ul.cross_sell_products.product-list-container, #modal-product ul.up_sell_products.product-list-container').on('scroll', function () {

        if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {

            // Trigger next page on scroll end
            if ($(this).hasClass('cross_sell_products')) {

                var next_page = (parseInt($('#modal-product ul.cross_sell_products.product-list-container').attr('data-page')) + 1)
                load_data_related('#modal-product ul.cross_sell_products.product-list-container', $('.cross_sell_search').val(), next_page, true)

            } else {

                var next_page = (parseInt($('#modal-product ul.up_sell_products.product-list-container').attr('data-page')) + 1)
                load_data_related('#modal-product ul.up_sell_products.product-list-container', $('.up_sell_search').val(), next_page, true)

            }
        }
    })

    // Read search event
    $('#modal-product .cross_sell_search, #modal-product .up_sell_search').on('input', debounce(function () {

        var query = $(this).val()

        if ($(this).hasClass('up_sell_search')) {

            $('#modal-product ul.up_sell_products.product-list-container').attr('data-page', 1)
            window.next_page[btoa('#modal-product ul.up_sell_products.product-list-container')] = ''
            load_data_related('#modal-product ul.up_sell_products.product-list-container', query)

        } else {

            $('#modal-product ul.cross_sell_products.product-list-container').attr('data-page', 1)
            window.next_page[btoa('#modal-product ul.cross_sell_products.product-list-container')] = ''
            load_data_related('#modal-product ul.cross_sell_products.product-list-container', query)

        }

    }, 500))
}

// Process selected related template
var process_selected_related_template = function (type, related_products) {

    if (related_products != '[]' && related_products != '') {

        if (type == 'cross_sell_products') {
            var target = $('#modal-product ul.cross_sell_products.product-list-container-receiver')
        } else {
            var target = $('#modal-product ul.up_sell_products.product-list-container-receiver')
        }

        target.html('<li class="loading-data">Loading data...</li>')

        $
            .ajax({
                url: '/api/products-by-handle/' + related_products,
                method: 'GET'
            })
            .done(function (data) {

                if (data.total > 0) {

                    var output = ''

                    data.products.forEach(function (product) {

                        if (product.image) {
                            var image = `<img src="${product.image.src}" width="30" />`
                        } else {
                            var image = `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="30"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`
                        }

                        output += '<li data-handle="' + product.handle + '"><span>' + image + '</span> <span>' + product.title + '</span></li>'
                    })

                    if (type == 'cross_sell_products') {
                        target.html(output)
                    } else {
                        target.html(output)
                    }
                }
            })
    }
}

// Process selected related from metafields
var process_selected_related = function () {

    var cross_sell_products = $('#modal-product textarea[name="cross_sell_products"]').val()
    var up_sell_products = $('#modal-product textarea[name="up_sell_products"]').val()

    process_selected_related_template('cross_sell_products', cross_sell_products)
    process_selected_related_template('up_sell_products', up_sell_products)

}

// Setup sortable
var setup_sortable = function () {

    new Sortable($('.cross_sell_products.product-list-container')[0], {
        group: 'cross_sell_products',
        animation: 150,
        dataIdAttr: 'data-handle'
    })

    window.cross_sell_products_instance = false
    window.cross_sell_products_instance = new Sortable($('.cross_sell_products.product-list-container-receiver')[0], {
        group: 'cross_sell_products',
        animation: 150,
        dataIdAttr: 'data-handle',
        onEnd: function (e) {
            convert_related(cross_sell_products_instance.toArray(), $('#modal-product textarea[name="cross_sell_products"]'))
        },
        onAdd: function (e) {
            convert_related(cross_sell_products_instance.toArray(), $('#modal-product textarea[name="cross_sell_products"]'))
        }
    })

    new Sortable($('.up_sell_products.product-list-container')[0], {
        group: 'up_sell_products',
        animation: 150,
        dataIdAttr: 'data-handle'
    })

    window.up_sell_products_instance = false
    window.up_sell_products_instance = new Sortable($('.up_sell_products.product-list-container-receiver')[0], {
        group: 'up_sell_products',
        animation: 150,
        dataIdAttr: 'data-handle',
        onEnd: function (e) {
            convert_related(up_sell_products_instance.toArray(), $('#modal-product textarea[name="up_sell_products"]'))
        },
        onAdd: function (e) {
            convert_related(up_sell_products_instance.toArray(), $('#modal-product textarea[name="up_sell_products"]'))
        }
    })
}

// Convert Sortable to textarea value
var convert_related = function (data, textarea) {
    textarea.val(JSON.stringify(data))
}

// Generate product options table
var generate_product_options_table = function (product, metafields, new_options = false, new_option_name = false, new_option_skus = false) {

    var heading = '<tr>'

    product.options.forEach(function (option) {
        heading += '<th>' + option.name + '</th>'
    })

    if (new_option_name) {
        heading += '<th>'

        if (new_options) {
            heading += '<input name="final_option_4_values" placeholder="Option 4 Values" type="hidden" value="' + new_options.join(',') + '" />'
        }

        heading += '<input name="final_option_4_name" placeholder="Option 4 Name" type="text" value="' + new_option_name + '" /></th>'

    } else {
        heading += '<th><input name="final_option_4_name" placeholder="Option 4 Name" type="text" /></th>'
    }

    heading += '<th>SKU</th>'
    heading += '</tr>'

    var body = ''

    if (new_option_skus) {
        new_option_skus = new_option_skus.split('|###|')
    }

    product.variants.forEach(function (variant) {

        if (new_options) {

            new_options.forEach(function (new_option) {

                var current_sku = ''

                if (new_option_skus) {

                    new_option_skus.forEach(function (new_option_sku) {

                        new_option_sku = new_option_sku.split('###')

                        if (new_option_sku[0] == variant.option1 && new_option_sku[1] == variant.option2 && new_option_sku[2] == variant.option3 && new_option_sku[3] == String(new_option).trim()) {
                            current_sku = String(new_option_sku[4]).replace('SKU:', '').trim()
                        }

                    })
                }

                body += `<tr>
                            <td>${variant.option1}</td>
                            <td>${variant.option2}</td>
                            <td>${variant.option3}</td>
                            <td><input placeholder="Option 4 Value" name="option4_value" type="text" value="${String(new_option).trim()}" /></td>
                            <td><input placeholder="SKU" name="sku" type="text" value="${current_sku}" /></td>
                        </tr>`
            })

        } else {

            body += `<tr>
                        <td>${variant.option1}</td>
                        <td>${variant.option2}</td>
                        <td>${variant.option3}</td>
                        <td><input placeholder="Option 4 Value" name="option4_value" type="text" /></td>
                        <td><input placeholder="SKU" name="sku" type="text" /></td>
                    </tr>`
        }
    })

    output = `<table>
                  <thead>
                    ${heading}
                  </thead>
                  <tbody>
                    ${body} 
                  </tbody>
                </table>`

    return output
}

// Product options modal template
var product_options_modal_template = function (product, metafields) {

    var output = ''
    var message = 'No product options or product options less than 3, please setup product options (variants) in Shopify Admin'
    var footer_style = ''

    if (!product) {
        return message
    }

    if (product.options.length < 3) {
        return message
    }

    if (get_metafield_value(metafields, 'global', 'option_4_name') != '' && get_metafield_value(metafields, 'global', 'option_4_values') != '') {

        var new_options = get_metafield_value(metafields, 'global', 'option_4_values')
        new_options = new_options.split(',')

        // Generate Table
        var table = generate_product_options_table(product, metafields, new_options, get_metafield_value(metafields, 'global', 'option_4_name'), get_metafield_value(metafields, 'global', 'option_4_skus'))

        output = `
                <main class="modal__content align-left" id="modal-product-content">
                    <h2 id="modal-product-title" class="align-center">
                        ${product.title}
                    </h2>
                    <br/>
                    ${table}
                </main>`

    } else {

        // Generate Generator
        var generator = `
                    <br/>
                    <div class="target">
                        <article>
                          <div class="columns three">
                            <div class="row">
                              <label class="mb10"><strong>Option 4</strong></label>
                              <input type="text" name="option4_name_generator" placeholder="Option 4 Name" />
                            </div>
                          </div>
                          <div class="columns nine">
                            <div class="row">
                              <label class="mb10">&nbsp;</label>
                              <input type="text" name="option4_value_generator" placeholder="Separate options with a comma" />
                            </div>
                          </div>
                        </article>
                        <article>
                            <div class="columns twelve">
                                <div class="row mt10">
                                    <button data-metafields-json="${encodeURIComponent(JSON.stringify(metafields))}" data-product-json="${encodeURIComponent(JSON.stringify(product))}">Generate Option 4</button>
                                </div>
                            </div>
                        </article>
                    </div>`

        output = `
                <main class="modal__content align-left" id="modal-product-content">
                    <h2 id="modal-product-title" class="align-center">
                        ${product.title}
                    </h2>
                    ${generator}
                </main>`

        footer_style = `style="display:none"`

    }

    output += `
                <footer class="modal__footer" ${footer_style}>
                    <img class="save-product-options-loading" src="/assets/img/loading.gif" style="display:none">
                    <button data-save-product-options data-product-id="${product.id}">Save</button>
                    <button class="secondary" data-micromodal-close aria-label="Close this dialog window">Cancel</button>
                    <div class="save-product-options-result-container"></div>

                    <br/>
                    <div class="align-center">
                        <img class="reset-product-options-loading" src="/assets/img/loading.gif" style="display:none">
                        <button data-product-id="${product.id}" style="" data-reset-product-options>Reset Option 4</button>
                        <div class="reset-product-options-result-container"></div>
                        <small class="red">(Warning, this will remove all product option 4 Values and SKUs)</small>
                    </div>
                </footer>`

    return output
}

// Show product modal
$('body').on('click', '[data-show-product-modal]', function (e) {

    e.preventDefault()

    var modal_container = $('#modal-product .modal__container')
    var product_id = $(this).attr('data-product-id')

    show_modal_loading(modal_container)
    MicroModal.show('modal-product')

    $
        .ajax({
            url: '/api/product/' + product_id,
            method: 'GET'
        })
        .done(function (data) {

            if (!data.product) {
                MicroModal.close('modal-product')
            } else {

                var shopify_data = product_modal_template(data.product, data.metafields)
                modal_container.empty().html(shopify_data)

                $('#summernote').summernote({
                    height: 150
                })

                window.next_page = []

                process_related()
                process_selected_related()
                setup_sortable()

            }
        })
})

// Save product
$('body').on('click', '#modal-product button[data-save-product]', function (e) {

    var product_id = $(this).attr('data-product-id')
    var form_data = $('#product-form').serializeArray()

    var button = $(this)

    button.attr('disabled', 'disabled')
    button.hide()
    $('.save-product-loading').show()
    $('.save-result-container').empty()

    $
        .ajax({
            url: '/api/product/save/' + product_id,
            method: 'POST',
            data: form_data
        })
        .done(function (data) {

            button.removeAttr('disabled')
            button.show()
            $('.save-product-loading').hide()

            if (data.error) {
                $('.save-result-container').empty().html('<div class="alert error"><dl><dt>Error!</dt><dd>' + data.error + '</dd></dl></div>')
            } else {
                $('.save-result-container').empty().html('<p>' + data.success + '</p>')
            }
        })
})

// Show product options modal
$('body').on('click', '[data-show-product-options-modal]', function (e) {

    e.preventDefault()

    var modal_container = $('#modal-product-options .modal__container')
    var product_id = $(this).attr('data-product-id')

    show_modal_loading(modal_container)
    MicroModal.show('modal-product-options')

    $
        .ajax({
            url: '/api/product/' + product_id,
            method: 'GET'
        })
        .done(function (data) {

            if (!data.product) {
                MicroModal.close('modal-product')
            } else {

                var shopify_data = product_options_modal_template(data.product, data.metafields)
                modal_container.empty().html(shopify_data)

            }
        })
})

// Generate Option 4
$('body').on('click', '#modal-product-options button[data-metafields-json]', function (e) {

    var option_4_name = $('#modal-product-options [name="option4_name_generator"]').val()
    var option_4_value = $('#modal-product-options [name="option4_value_generator"]').val()

    $('#modal-product-options [name="option4_name_generator"]').parent('.row').removeClass('error')
    $('#modal-product-options [name="option4_value_generator"]').parent('.row').removeClass('error')

    if (!option_4_name || !option_4_value) {

        if (!option_4_name) {
            $('#modal-product-options [name="option4_name_generator"]').parent('.row').addClass('error')
        }

        if (!option_4_value) {
            $('#modal-product-options [name="option4_value_generator"]').parent('.row').addClass('error')
        }

        return
    }

    var option_4_values = option_4_value.split(',')

    if (option_4_values.length) {

        var product = JSON.parse(decodeURIComponent($(this).attr('data-product-json')))
        var metafields = JSON.parse(decodeURIComponent($(this).attr('data-metafields-json')))

        var table = generate_product_options_table(product, metafields, option_4_values, option_4_name)

        $('#modal-product-options .target').html(table)
        $('#modal-product-options .modal__footer').show()

    } else {
        $('#modal-product-options [name="option4_value_generator"]').parent('.row').addClass('error')
    }

})

// Reset Product Option 4
$('body').on('click', '#modal-product-options button[data-reset-product-options]', function (e) {

    var product_id = $(this).attr('data-product-id')
    var button = $(this)

    button.attr('disabled', 'disabled')
    button.hide()
    $('.reset-product-options-loading').show()
    $('.reset-product-options-result-container').empty()

    $
        .ajax({
            url: '/api/product/save/' + product_id,
            method: 'POST',
            data: {
                'option_4_name': '',
                'option_4_values': '',
                'option_4_skus': ''
            }
        })
        .done(function (data) {

            if (data.error) {
                $('.reset-product-options-result-container').empty().html('<div class="alert error"><dl><dt>Error!</dt><dd>' + data.error + '</dd></dl></div>')
            } else {

                $
                    .ajax({
                        url: '/api/product/' + product_id,
                        method: 'GET'
                    })
                    .done(function (data) {

                        button.removeAttr('disabled')
                        button.show()
                        $('.reset-product-options-loading').hide()

                        if (!data.product) {
                            $('.reset-product-options-result-container').empty().html('<div class="alert error"><dl><dt>Error!</dt><dd>Failed to get product data, close modal and try to re-open.</dd></dl></div>')
                        } else {

                            var shopify_data = product_options_modal_template(data.product, data.metafields)
                            $('#modal-product-options .modal__container').empty().html(shopify_data)

                        }
                    })
            }
        })
})

// Save Product Option 4
$('body').on('click', '#modal-product-options button[data-save-product-options]', function (e) {

    var product_id = $(this).attr('data-product-id')
    var button = $(this)

    button.attr('disabled', 'disabled')
    button.hide()
    $('.save-product-options-loading').show()
    $('.save-product-options-result-container').empty()

    var option_4_name = $('#modal-product-options [name="final_option_4_name"]').val()
    var option_4_values = $('#modal-product-options [name="final_option_4_values"]').val()
    var option_4_skus = []

    $('#modal-product-options table tbody tr').each(function () {

        var option_1 = $(this).find('td:nth-child(1)').text()
        var option_2 = $(this).find('td:nth-child(2)').text()
        var option_3 = $(this).find('td:nth-child(3)').text()
        var option_4 = $(this).find('td:nth-child(4) input').val()
        var option_sku = $(this).find('td:nth-child(5) input').val()

        var option_4_sku = [option_1, option_2, option_3, option_4, ('SKU:' + option_sku)]
        option_4_sku = option_4_sku.join('###')

        option_4_skus.push(option_4_sku)
    })

    if (option_4_skus.length) {
        option_4_skus = option_4_skus.join('|###|')
    } else {
        option_4_skus = ''
    }

    $
        .ajax({
            url: '/api/product/save/' + product_id,
            method: 'POST',
            data: {
                'option_4_name': option_4_name,
                'option_4_values': option_4_values,
                'option_4_skus': option_4_skus
            }
        })
        .done(function (data) {

            button.removeAttr('disabled')
            button.show()
            $('.save-product-options-loading').hide()

            if (data.error) {
                $('.save-product-options-result-container').empty().html('<div class="alert error"><dl><dt>Error!</dt><dd>' + data.error + '</dd></dl></div>')
            } else {
                $('.save-product-options-result-container').empty().html('<p>' + data.success + '</p>')
            }
        })
})

// Show collection modal
$('body').on('click', '#collection-card td button[data-collection-id]', function (e) {

    var modal_container = $('#modal-collection .modal__container')
    var collection_id = $(this).attr('data-collection-id')

    show_modal_loading(modal_container)
    MicroModal.show('modal-collection')

    $
        .ajax({
            url: '/api/collection/save/' + collection_id,
            method: 'GET'
        })
        .done(function (data) {

            if (data.error) {
                modal_container.empty().html('<div class="alert error"><dl><dt>Error!</dt><dd>' + data.error + '</dd></dl></div>')
            } else {

                modal_container.empty().html('<p>' + data.success + '</p>')

                setTimeout(function () {
                    MicroModal.close('modal-collection')
                }, 800)

            }
        })
})

// Sync Algolia Settings
$('body').on('click', '.sync-algolia-settings', function (e) {

    e.preventDefault()

    var modal_container = $('#modal-algolia .modal__container')

    show_modal_loading(modal_container)
    MicroModal.show('modal-algolia')

    $
        .ajax({
            url: '/api/sync-algolia-settings',
            method: 'GET'
        })
        .done(function (data) {

            if (data.error) {
                modal_container.empty().html('<div class="alert error"><dl><dt>Error!</dt><dd>' + data.error + '</dd></dl></div>')
            } else {

                modal_container.empty().html('<p>' + data.success + '</p>')

                setTimeout(function () {
                    MicroModal.close('modal-algolia')
                }, 800)

            }
        })

})


/**
 * Algolia Products : Custom Hits Render
 */
const renderHitsWithProductOptions = (renderOptions, isFirstRender) => {

    const { hits, widgetParams } = renderOptions

    if (hits.length) {

        widgetParams.container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th colspan="2">Product</th>
              <th>Vendor</th>
              <th>Type</th>
              <th>Tags</th>
              <th class="align-center">Product Options</th>
            </tr>
          </thead>
          <tbody>
            ${hits
                .map(
                    item =>
                        `<tr>
                  <td width="20">
                    <a href="#" data-show-product-modal="" data-product-id="${item.id}">
                        ${item.image ? `<img src="${item.image}" width="50">` : `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="50"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`}
                    </a>
                  </td>
                  <td><a href="#" data-show-product-modal="" data-product-id="${item.id}">${item.title}</a></td>
                  <td>${item.vendor}</td>
                  <td>${item.product_type}</td>
                  <td>
                      <span class="tag grey">
                        ${item.tags.map(tag => `${tag}`).join(', ')}
                      </span>
                  </td>
                  <td class="align-center"><button class="secondary icon-product" data-show-product-options-modal data-product-id="${item.id}"></button></td>
                </tr>`
                )
                .join('')}
          </tbody>
        </table>
      `
    } else {
        widgetParams.container.innerHTML = `
            <div class="empty-search-results">
              <i class="icon-search icon-search--big"></i>
              <h2 class="empty-search-results__title">Could not find any products</h2>
              <p class="empty-search-results__message">Try changing the search term</p>
            </div> <!-- .empty-search-results -->`
    }
}

const customHitsWithProductOptions = instantsearch.connectors.connectHits(renderHitsWithProductOptions)

const renderHits = (renderOptions, isFirstRender) => {

    const { hits, widgetParams } = renderOptions

    if (hits.length) {

        widgetParams.container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th colspan="2">Product</th>
              <th>Vendor</th>
              <th>Type</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            ${hits
                .map(
                    item =>
                        `<tr>
                  <td width="20">
                    <a href="#" data-show-product-modal="" data-product-id="${item.id}">
                        ${item.image ? `<img src="${item.image}" width="50">` : `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="50"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`}
                    </a>
                  </td>
                  <td><a href="#" data-show-product-modal="" data-product-id="${item.id}">${item.title}</a></td>
                  <td>${item.vendor}</td>
                  <td>${item.product_type}</td>
                  <td>
                      <span class="tag grey">
                        ${item.tags.map(tag => `${tag}`).join(', ')}
                      </span>
                  </td>
                </tr>`
                )
                .join('')}
          </tbody>
        </table>
      `
    } else {
        widgetParams.container.innerHTML = `
            <div class="empty-search-results">
              <i class="icon-search icon-search--big"></i>
              <h2 class="empty-search-results__title">Could not find any products</h2>
              <p class="empty-search-results__message">Try changing the search term</p>
            </div> <!-- .empty-search-results -->`
    }
}

const customHits = instantsearch.connectors.connectHits(renderHits)

const renderCollectionHits = (renderOptions, isFirstRender) => {

    const { hits, widgetParams } = renderOptions

    if (hits.length) {

        widgetParams.container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th colspan="2">Collection</th>
              <th class="align-center">Sync with Algolia</th>
            </tr>
          </thead>
          <tbody>
            ${hits
                .map(
                    item =>
                        `<tr>
                  <td width="20">
                    ${item.image ? `<img src="${item.image}" width="50">` : `<svg id="no-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="50"><path fill="#d5dbe2" d="M14 9l-5 5-3-2-5 3v4h18v-6z"></path><path d="M19 0H1C.448 0 0 .448 0 1v18c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1zM8 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.654 0 3-1.346 3-3S9.654 4 8 4 5 5.346 5 7s1.346 3 3 3zm-6 8v-2.434l3.972-2.383 2.473 1.65c.398.264.925.21 1.262-.126l4.367-4.367L18 13.48V18H2zM18 2v8.92l-3.375-2.7c-.398-.32-.973-.287-1.332.073l-4.42 4.42-2.318-1.545c-.322-.214-.74-.225-1.07-.025L2 13.233V2h16z"></path></svg>`}
                  </td>
                  <td>${item.title}</td>
                  <td class="align-center"><button class="secondary icon-refresh" data-collection-id="${item.objectID}"></button></td>
                </tr>`
                )
                .join('')}
          </tbody>
        </table>
      `
    } else {
        widgetParams.container.innerHTML = `
            <div class="empty-search-results">
              <i class="icon-search icon-search--big"></i>
              <h2 class="empty-search-results__title">Could not find any collections</h2>
              <p class="empty-search-results__message">Try changing the search term</p>
            </div> <!-- .empty-search-results -->`
    }
}

const customCollectionHits = instantsearch.connectors.connectHits(renderCollectionHits)

const renderPagination = (renderOptions, isFirstRender) => {
    const {
        pages,
        currentRefinement,
        nbPages,
        isFirstPage,
        isLastPage,
        refine,
        createURL,
        widgetParams
    } = renderOptions;

    if (pages.length < 2 && !pages[1]) {
        widgetParams.container.innerHTML = ``
    } else {

        widgetParams.container.innerHTML = `
        <div class="pagination">
          <span class="button-group">
            <a href="${createURL(currentRefinement - 1)}" data-value="${currentRefinement - 1}" class="secondary button icon-arrow-left ${isFirstPage ? `disabled` : ``}">&nbsp;</a>
            <a href="${createURL(currentRefinement + 1)}" data-value="${currentRefinement + 1}" class="secondary button icon-arrow-right ${isLastPage ? `disabled` : ``}">&nbsp;</a>
          </span>
        </div>
      `

        widgetParams.container.querySelectorAll('a').forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
                refine(event.currentTarget.dataset.value);
            })
        })
    }
}

const customPagination = instantsearch.connectors.connectPagination(renderPagination)


/**
 * Algolia Products : Products
 */
var products_algolia = instantsearch({
    indexName: 'shopify_products',
    searchClient: algoliasearch('Q2K319H8NV', '2abbd8490ba2a2fa66bbe1b437318125'),
    searchParameters: {
        maxValuesPerFacet: 100,
        attributesToRetrieve: "*",
        distinct: true,
        clickAnalytics: true,
        hitsPerPage: 50
    }
})

products_algolia.addWidget(
    instantsearch.widgets.searchBox({
        container: '#product-search-box',
        placeholder: 'Search products',
        showSubmit: false,
        showReset: false
    })
)

products_algolia.addWidget(
    customHitsWithProductOptions({
        container: document.querySelector('#product-hits')
    })
)

products_algolia.addWidget(
    customPagination({
        container: document.querySelector('#product-pagination')
    })
)

products_algolia.start()


/**
 * Algolia Collection : Collection
 */
var collection_algolia = instantsearch({
    indexName: 'shopify_collections',
    searchClient: algoliasearch('Q2K319H8NV', '2abbd8490ba2a2fa66bbe1b437318125'),
    searchParameters: {
        maxValuesPerFacet: 100,
        attributesToRetrieve: "*",
        distinct: true,
        clickAnalytics: true,
        hitsPerPage: 50
    }
})

collection_algolia.addWidget(
    instantsearch.widgets.searchBox({
        container: '#collection-search-box',
        placeholder: 'Search collections',
        showSubmit: false,
        showReset: false
    })
)

collection_algolia.addWidget(
    customCollectionHits({
        container: document.querySelector('#collection-hits')
    })
)

collection_algolia.addWidget(
    customPagination({
        container: document.querySelector('#collection-pagination')
    })
)

collection_algolia.start()


/**
 * Algolia Products : Free Shipping
 */
var free_shipping_algolia = instantsearch({
    indexName: 'shopify_products',
    searchClient: algoliasearch('Q2K319H8NV', '2abbd8490ba2a2fa66bbe1b437318125'),
    searchParameters: {
        maxValuesPerFacet: 100,
        attributesToRetrieve: "*",
        distinct: true,
        filters: "meta.global.free_shipping:Yes",
        clickAnalytics: true,
        hitsPerPage: 50
    }
})

free_shipping_algolia.addWidget(
    instantsearch.widgets.searchBox({
        container: '#fs-search-box',
        placeholder: 'Search products',
        showSubmit: false,
        showReset: false
    })
)

free_shipping_algolia.addWidget(
    customHits({
        container: document.querySelector('#fs-hits')
    })
)

free_shipping_algolia.addWidget(
    customPagination({
        container: document.querySelector('#fs-pagination')
    })
)

free_shipping_algolia.start()


/**
 * Algolia Products : Free Ship Discount
 */
var free_ship_discount_algolia = instantsearch({
    indexName: 'shopify_products',
    searchClient: algoliasearch('Q2K319H8NV', '2abbd8490ba2a2fa66bbe1b437318125'),
    searchParameters: {
        maxValuesPerFacet: 100,
        attributesToRetrieve: "*",
        distinct: true,
        filters: "meta.global.free_ship_discount:Yes",
        clickAnalytics: true,
        hitsPerPage: 50
    }
})

free_ship_discount_algolia.addWidget(
    instantsearch.widgets.searchBox({
        container: '#fsd-search-box',
        placeholder: 'Search products',
        showSubmit: false,
        showReset: false
    })
)

free_ship_discount_algolia.addWidget(
    customHits({
        container: document.querySelector('#fsd-hits')
    })
)

free_ship_discount_algolia.addWidget(
    customPagination({
        container: document.querySelector('#fsd-pagination')
    })
)

free_ship_discount_algolia.start()


/**
 * Algolia Products : Oversized
 */
var oversized_algolia = instantsearch({
    indexName: 'shopify_products',
    searchClient: algoliasearch('Q2K319H8NV', '2abbd8490ba2a2fa66bbe1b437318125'),
    searchParameters: {
        maxValuesPerFacet: 100,
        attributesToRetrieve: "*",
        distinct: true,
        filters: "meta.global.oversized:Yes",
        clickAnalytics: true,
        hitsPerPage: 50
    }
})

oversized_algolia.addWidget(
    instantsearch.widgets.searchBox({
        container: '#oversized-search-box',
        placeholder: 'Search products',
        showSubmit: false,
        showReset: false
    })
)

oversized_algolia.addWidget(
    customHits({
        container: document.querySelector('#oversized-hits')
    })
)

oversized_algolia.addWidget(
    customPagination({
        container: document.querySelector('#oversized-pagination')
    })
)

oversized_algolia.start()

