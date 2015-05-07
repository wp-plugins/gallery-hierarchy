if(jQuery) (function($){
	$.extend($.fn, {
		folders: (function() {
			/**
			 * To use with array.sort
			 * arr.sort(function(o1, o2) {
			 *   return naturalSorter(o1.t, o2.t);
			 * });
			 * http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
			 * http://jsfiddle.net/MikeGrace/Vgavb/
			 */
			function naturalSorter(as, bs){
				var a, b, a1, b1, i= 0, n, L,
				rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
				if(as=== bs) return 0;
				a= as.toLowerCase().match(rx);
				b= bs.toLowerCase().match(rx);
				L= a.length;
				while(i<L){
					if(!b[i]) return 1;
					a1= a[i],
					b1= b[i++];
					if(a1!== b1){
						n= a1-b1;
						if(!isNaN(n)) return n;
						return a1>b1? 1:-1;
					}
				}

				return b[i]? -1:0;
			}

			function receiveList(obj, data, textStatus, jqXHR) {
				if (!data.error) {
					displayFiles(obj.children('div'), data);
				}
			}

			/**
			 * Generates the HTML list displaying the file list with associated
			 * checkboxes/radio buttons if form elements are required.
			 *
			 * @param obj JQueryDOMObject Object to append HTML list to
			 * @param files Object Object containing file list
			 * @param base String String containing the path to the file (to be used
			 *                    in the value.
			 */
			function displayFiles(obj, files, base) {
				var f, ul, reorder = false;
				// Create a unnumbered list if we haven't already got one
				if (!obj.children('div').has('ul').length) {
					obj.children('div').html((ul = $('<ul></ul>')));
				} else {
					reorder = true;
					ul = obj.children('div').children('ul');
				}

				for (f in files) {
					addPart.apply(this, [ul, files[f], base]);
				}

				if (reorder) {
					// Reorder the elements
				}
			}

			function addPart(obj, data, base, order) {
				var li = $('<li data-id="' + data.id + '"></li>'), input, label, link;
				
				if (order) {
					// Go through current parts and find where to insert the new one
					var after;
					obj.children().each(function() {
						if (naturalSorter($(this).text(), data.label) > 0) { // should be before
							return false;
						} else {
							after = $(this);
						}
					});
					if (!after) {
						console.log('no after');
						obj.prepend(li);
					} else {
						console.log('after');
						console.log(after);
						after.after(li);
					}
				} else {
					obj.append(li);
				}
				
				li.append((label = $('<label>' + data.label + '</label>')));
				// Create the input if required
				if (this.options.name) {
					// @todo input.append('<option value="' + value + '></option>');
				}

				// Add click (select) functionality
				li.click(select.bind(this, li, data));

				data._obj = li;

				//@todo if (data.type == 'dir') {
					// Add new link if can create new
					if (this.options.create) {
						li.append((link = $('<div class="new" title="Create a new sub-folder"></div>')));
						link.click(createFile.bind(this, li, data.id));
						li.append((link = $('<div class="del" title="Delete folder"></div>')));
						link.click(deleteFile.bind(this, li, data.id, data.label));
					}

					// Add expand button if have subdirectories
					if (data.sub) {
						addSubParts.apply(this, [li, data.sub, base]);
					}
				//}
			}

			function addSubParts(obj, sub, base) {
				var span, div;
				obj.addClass('parent');

				// Add expand objnk
				obj.append((span = $('<span title="Expand Folder">&raquo;</span>')));
				obj.append((div = $('<div></div>')));
				span.click(expand.bind(this, obj));

				// Draw the subdirectories if we have it
				if (sub === true) {
					if (!obj.children('div').has('ul').length) {
						obj.children('div').html($('<ul></ul>'));
					}
				} else if (sub) {
					console.log('addSubParts is calling displayFiles');
					displayFiles.apply(this, [obj, sub,
							base + this.options.separator + name]);
				}
			}

			function select(obj, file, ev) {
				if (ev.isDefaultPrevented()) return;
				ev.preventDefault();
				
				var selected = false;

				if (this.selection[file.id]) { // Was selected
					delete this.selection[file.id];
					
					obj.removeClass(this.options.selectedClass);
					
					var t = this;

					// Remove childSelected from parents
					obj.parents().each(function() {
						if ($(this).is(t.div)) {
							return false;
						}
						if ($(this).find('.' + t.options.selectedClass).length) {
							return false;
						}

						$(this).removeClass('childSelected');
					});

				} else { // Now selected
					selected = true;
					
					obj.addClass(this.options.selectedClass);
					
					if (!this.options.multiple) {
						// Remove others from selection
						if (this.selection) {
							var s;
							for (s in this.selection) {
								if (this.options.selectedClass) {
									if (this.selection[s]._obj) {
										this.selection[s]._obj.removeClass(this.options.selectedClass);
									}
								}

								delete this.selection[s];
							}
						}
						

						// Close the  
						expand.apply(this, [this.div, null, false]);
					} else {
						var t = this;

						// Mark all parent objects
						obj.parents().each(function() {
							if ($(this).is(t.div)) {
								return false;
							}
							if ($(this).is('li')) {
								$(this).addClass('childSelected');
							}
						});
					}

					this.selection[file.id] = file;
				}

				// Handle input if we have them
				if (this.options.name) {
				}

				// Change label
				// Count selected
				var s,i = 0;
				for (s in this.selection) i++;
				switch (i) {
					case 0:
						this.mainLabel.text(this.options.selectLabel);
						this.div.attr('title', this.options.selectLabel);
						break;
					case 1:
						this.mainLabel.text(this.selection[s].label);
								//+ (this.options.multiple ? ' selected' : ''));
						this.div.removeAttr('title')
						break;
					default:
						this.mainLabel.text(i + ' folders selected');

						// Generate a title
						var selected = $.map(this.selection, function(s) {
							return s.label;
						});
						this.div.attr('title', selected.join(', '));
				}

				// Handle selection function if we have them
				if (this.options.selection) {
					var s, selected = [];
					for (s in this.selection) {
						selected.push(this.selection[s]);
					}
					this.options.selection(selected);
				}
			}

			/** Called to create a new folder
			 */
			function createFile(obj, id, ev) {
				if (ev.isDefaultPrevented()) return;
				ev.preventDefault();

				var name;
				while (true) {
					if ((name = prompt('Please enter a name for the new folder'))) {
						var data = {a: 'create', name: name}
						if (id) data.id = id;
						$.post(this.options.ajaxScript, data,
								finishCreate.bind(this, obj, name));
						break;
					} else if (name == undefined) {
						break;
					}
				}
			}

			function finishCreate(obj, name, data, textStatus, jqXHR) {
				// Alert an error
				if (data.error) {
					alert(data.error);
					return;
				}

				// Add new folder to list
				// Check if item has children already
				if (!obj.hasClass('parent')) {
					// Add parts so it can be expanded
					// @todo Delete? if (obj.attr('data-id')) {
						addSubParts.apply(this, [obj, true]);
					//}
				}
				addPart.apply(this, [obj.children('div').children('ul'),
						{ label: name, id: data.id }, null, true]);
				// Expand menu
				expand.apply(this, [obj, null, true]);
				//expand(obj, null, true, [{ label: name, id: data.id }]);
			}

			function deleteFile(obj, id, label, ev) {
				if (ev.isDefaultPrevented()) return;
				ev.preventDefault();

				var name;
				if ((name = confirm('Are you sure you want to delete the ' + label
						+ ' folder? All files and folders within this folder will be '
						+ 'deleted.'))) {
					var data = {a: 'delete', id: id}
					$.post(this.options.ajaxScript, data,
							finishDelete.bind(this, obj));
				}
			}

			function finishDelete(obj, data, textStatus, jqXHR) {
				// Alert an error
				if (data.error) {
					alert(data.error);
					return;
				}

				if (data.msg) {
					alert(data.msg);
				}

				// Remove object
				obj.remove();
			}

			/**
			 * Expands a folder.
			 */
			function expand(obj, ev, force, files) {
				if (ev) {
					if (ev.isDefaultPrevented()) return;
					ev.preventDefault();
				}
				
				if (obj.hasClass('expand') && force !== true) {
					obj.removeClass('expand');
					obj.children('span').html('&raquo;');
				} else if (force !== false) {
					obj.children('span').html('&laquo;');
					if (this.options.collapseSiblings) {
						obj.siblings('li').removeClass('expand');
						obj.siblings('li').children('span').html('&raquo;');
					}
					obj.addClass('expand');
				
					// Check if we have already drawn the folder list
					if (!obj.children('div').has('ul').length || files) {
						var list;
						// Draw file list
						if (files) {
							displayFiles(obj, files);
						} else if (this.options.ajaxScript) {
							obj.children('div').html(this.options.loadingLabel);

							// Send AJAX request
							//console.log('sending request to ' + this.options.ajaxScript);
							$.post(this.options.ajaxScript, {id: obj.attr('data-id')},
									receiveList.bind(this, obj));
						} else {
							// Disable
							return;
						}
					}
				}
			}

			function closeOut(ev) {
				if (!$(ev.target).parents().is(this.obj)) {
					expand.apply(this, [this.div, null, false]);
				}
			}
			
			function Folder(obj, options) {
				// Merge options with default options
				this.options = $.extend({
					loadingLabel: 'Loading...',
					selectLabel: 'Select a folder',
					multiple: false,
					create: false,
					separator: '/',
					collapseSiblings: true,
					class: 'jFolders'
				}, options);

				// Set selected class to default if there is none
				if (!this.options.selectedClass) {
					this.options.selectedClass = 'selected';
				}

				this.obj = obj;
				this.selection = {};

				// Add class if set
				if (this.options.class) {
					obj.addClass(this.options.class);
				}

				obj.append(this.div = $('<div class="parent"></div>'));

				/* @todo Implement
				if (options.name) {
					$(this).append((input = $('<select name="' + options.name 
							+ '" style="display: none;"></select>')));
				}*/

				// Do label
				this.div.html((this.mainLabel = $('<label>' + this.options.selectLabel
						+ '</label>')));

				addSubParts.apply(this, [this.div, true]);

				this.div.click(expand.bind(this, this.div));

				// Add new folder link
				if (this.options.create) {
					this.obj.append((createLink = $('<a>New</a>')
							.click(createFile.bind(this, this.div, null))));
				}

				// Build what we have if we have something
				if (this.options.files) {
					displayFiles.apply(this, [this.div, this.options.files]);
				}
				
				// Add hook onto document to close if user clicks somewhere else
				$(document).on('click', closeOut.bind(this));
			}

			return function(options, files) {
				$(this).each( function() {
					new Folder($(this), options, files);
				});

				return $(this);
			};
		})()
	});
})(jQuery);
