/**
 * jquery.filter-list.js
 * ------------------------------------------------------
 * Authors: Jeroen Ransijn
 * Company: Aan Zee
 * version: 1.0
 * Usage: $('[data-filter-list]').filterList();
 */
;(function (root, $, undefined) {
	"use strict";

	var pluginName = "filterList";
	var defaults = {
		isToggledWithClassNames: false,
		isFilteredOnKeyup: true,
		filterListAttribute: 'data-filter-list',
		selectorItem: 'li.klip',
		classNameHidden: 'is-hidden',
		classNameShown: 'is-shown'
	};

	// Case-insensitive "contains"
	$.expr[':'].Contains = function(a,i,m){
		return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	// The actual plugin constructor
	function Plugin( element, options ) {
		this.element = element;
		this.$el = $(element);

		this.options = $.extend( {}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	Plugin.prototype = {

		init: function () {
			var listSelector = this.$el.attr( this.options['filterListAttribute'] );
                        this.$search = this.$el.find('.search-input');
			this.$list = this.$el.find(listSelector);
			this.$items = this.$list.find( this.options['selectorItem'] );

			if (this.$list.length > 0) {
		            this.$el
				    .on('keyup', this._onKeyup.bind(this))
				    .on('search', this.search.bind(this));
                            this.$list
                                    .on('DOMNodeRemoved', 'li.klip', this._onRemove.bind(this)) 
                                    .on('DOMNodeInserted', 'li.klip', this._onInsert.bind(this)); 
			}
                        console.log("Init called");
		},
		reset: function () {
			if ( this.options['isToggledWithClassNames'] ) {
				this.$list.find( this.options['selectorItem'] )
					.removeClass(this.options['classNameHidden'] + ' ' + this.options['classNameShown']);
			} else {
				this.$list.find( this.options['selectorItem'] ).show();
			}

			this.$el.trigger('reset');
		},
		_onKeyup: function (e) {
			if ((e && e.which == 13 || this.options['isFilteredOnKeyup']) ) {
				this.search();
			}
		},
                _onInsert: function(e) {
                      this.$items = this.$list.find( this.options['selectorItem'] );
                },
                _onRemove: function(e) {
                      this.$items = this.$list.find( this.options['selectorItem'] );
                      console.log(this.$items);
                      console.log("Stop event");
                },
		search: function () {
			var searchValue = this.$search.val();

			if (searchValue.trim() === "") {
				return this.reset();
			}

			var matches = this.$items.filter(':Contains(' + searchValue + ')');
			var nonMatches = this.$items.not( matches );

			// Hide non matches
			if ( this.options['isToggledWithClassNames'] ) {
				nonMatches
					.addClass( this.options['classNameHidden'] )
					.removeClass(this.options['classNameShown']);
			} else {
				nonMatches.hide();
			}

			// Show matches
			if ( this.options['isToggledWithClassNames'] ) {
				matches
					.removeClass( this.options['classNameHidden'] )
					.addClass( this.options['classNameShown'] );
			} else {
				matches.show();
			}

			this.$el.trigger('filter', [searchValue || "", matches, nonMatches]);
		},
		getList: function () {
			return this.$list;
		}
	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function ( options ) {
		this.each(function () {
			if ( ! $.data(this, "plugin-" + pluginName)) {
                            console.log("New one");
			    $.data(this, "plugin-" + pluginName, new Plugin( this, options ));
		        } else {
                            console.log("Existing one");
                            $.data(this, "plugin-" + pluginName);
                        }
		});
               
                return this;
	};
                    
})(this, jQuery);
