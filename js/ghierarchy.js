
// @todo Remove

(function($) {
	var groups = {};
	var options = {};
	var defaultOptions = {
		/**
		 * @prop generators {object} Object containing link types and
		 * generating functions to draw the
		 * contents of the floater. Will be given the object to draw into and
		 * the client window width and height.
		 * Called when the window is first popped up and any time the window
		 * is resized. The floater will be centered after this function has
		 * returned.
		 */
		generators: {
			image: imageDraw.bind(this),
		},
		
		/**
		 * @prop default {string} Default type of any URL links that can't be
		 * determined.
		 * Type should be 'image' or one of those in the generators option.
		 */
		default: 'image',
	
		/**
		 * @prop close {boolean} If true, a close button div will be added to the
		 * floater box.
		 */
		close: true,

		/**
		 * @prop backgroundClose {boolean} If true, clicking on the background
		 * will close the floater.
		 */
		backgroundClose: true,

		/**
		 * @prop ignorePrevented {boolean} If true, any events with the
		 * default prevented will be ignored
		 */
		ignorePrevented: true,

		/**
		 * @prop scroll {boolean} If true, scroll buttons will allow the user
		 * to scroll through the elements of that currently floated group.
		 */
		scroll: false,
		/**
		 * @prop autoscroll {integer} If not 0, will be the number of seconds
		 * each element is paused on for.
		 */
		autoscroll: 0,
	};

	function Viewer(id, element) {
		this.objects = {};
		this.options = ((id && options[id]) ? options[id] : defaultOptions);

		// Write floater
		$('body').append((this.objects.backing = $('<div class="fBacking"></div>')
				.append($('<div></div>').append((this.objects.box = $('<div></div>')
				.append((this.objects.div = $('<div></div>'))))))));

		// Add title and close
		if (this.options.close) {
			this.objects.box.prepend($('<div class="close"></div>')
					.click(this.close.bind(this)));
		}

		if (this.options.backgroundClose) {
			this.objects.backing.click(this.close.bind(this));
		}

		// Determine if there are other files
		if (this.options.scroll && id) {
			this.current = null;
			// Add scroll buttons
			if (groups[id]) {
				// Find current object in group
				var i = 0;
				while (i < groups[id].length) {
					if (groups[id][i].is(element)) {
						this.current = i;
						break;
					}
					i++;
				}

				if (this.current == null) {
					this.current = groups[id].length;
					groups[id].push(element);
				}

				this.objects.box.append((this.objects.left
						= $('<div class="left"></div>')
						.click(this.scroll.bind(this, id, -1, null)))).append(
						(this.objects.right = $('<div class="right"></div>')
						.click(this.scroll.bind(this, id, 1, null))));

				// Add autoscroll
				if (this.options.autoscroll) {
					this.objects.box.append(this.objects.autoControl
							= $('<div class="autoscroll">Pause</div>')
							.click(pause.bind(this, this.objects)));
					
					// Add autoscroll
					this.objects.autoscroll = setTimeout(autoscroll.bind(this,
							this.objects, 1), this.options.autoscroll);
				}
			}
		}

		callGenerator.call(this, element);
	}

	Viewer.prototype = {
		/**
		 * Close the floater stored in the given objects parameter
		 */
		close: function(ev) {
			if (ev) {
				if (!(ev.target === ev.currentTarget
						|| !$.contains(this.objects.box.get(0), ev.target))) {
					return;
				}
				ev.preventDefault();
			}

			// Kill myself
			this.objects.backing.remove();
			delete this;
		},

		/**
		 * Scrolls the floater objects.
		 *
		 * @param id {string} Image group identification string
		 * @param direction {1|-1} Direction to scroll the elements in
		 * @param noWrap {boolean} If not true, will go to the first element
		 *        if trying to scroll past the end of the array and the last
		 *        for past the start of the array.
		 */
		scroll: function(id, direction, noWrap, ev) {
			if (ev && ev.preventDefault) {
				ev.preventDefault();
			}

			// Find the element in
			if (!groups[id]) {
				return;
			}

			// Change current offset
			var newOffset = Math.max(0, Math.min(this.current
					+ direction, groups[id].length - 1));

			// Redraw if have a new offset
			if (newOffset != this.current) {
				this.current = newOffset;

				// Clear div
				this.objects.div.html('');

				// Call redraw
				callGenerator.call(this, groups[id][this.current]);
			}
		},

		/**
		 * Pauses/resumes the current autoscrolling
		 */
		pause: function() {
		}
	};

	/**
	 * Does the autoscroll for a Floater object
	 */
	function autoscroll() {
	}

	function callGenerator(element) {
		// @todo Draw div
		var type = this.options.default;
		if (this.options.generators[type]) {
			this.options.generators[type](element, this.objects);
		} else {
			/// @todo Error
		}
	}

	/**
	 * Function that handles the actual opening on the div
	 */
	function open(id, element, ev) {
		if (ev) {
			if (ev.defaultPrevented) {
				return;
			}
			ev.preventDefault();
		}

		if (!element) {
			if (!$(this)) {
				return false;
			}
			element = $(this);
		}

		return new Viewer(id, element);
	}

	function imageDraw() {
	}

	function initialise(opts, id, elements) {
		var defaultSet = false;
		var optGroup = false;

		// Set options for id
		if (opts && opts instanceof Object) {
			if (id) {
				var mergeOptions;
				if (options[id]) {
					mergeOptions = options[id];
				} else {
					mergeOptions = defaultOptions;
				}
				options[id] = $.extend({}, mergeOptions, opts);
			}
		}

		// Initialise each element
		if (elements) {
			elements.each(function() {
				var group;
				// Get data-group-id
				group = $(this).attr('data-group');
				if (!group && id) {
					group = id;
				}

				// Append to objects
				if (!groups[group]) {
					groups[group] = [];
				}

				groups[group].push($(this));

				// Attach click function
				$(this).click(open.bind(this, group, $(this)));
			});
		}
	}

	$.fn.extend({
		viewer: function(options, id) {
			initialise(options, id, $(this));

			return $(this);
		},
	});

	$.extend({
		viewer: {
			open: function(data, options) {
			},

			/**
			 * Set option(s) or retrieves a particular value of a specific option.
			 *
			 * @param id {string|null} Id of group of elements to change option(s) for
			 *           Set to null to change the default options (will not affect
			 *           current groups.
			 * @param option {string|object} String name of option to change/retrieve
			 *               or an object containing the new options.
			 * @param value {any} New value for option
			 */
			option: function(id, option, value) {
				if (option instanceof Object) {
					if (id) {
						options[id] = $.extend({},
								(options[id] ? options[id] : defaultOptions), option);
					} else {
						defaultOptions = $.extend({}, defaultOptions, option);
					}
				} else {
					var opts;
					if (id) {
						if (!options[id]) {
							options[id] = $.extend({}, defaultOptions);
						}
						opts = options[id];
					} else {
						opts = defaultOptions;
					}

					if (value !== undefined) {
						opts[option] = value;
						return value;
					} else {
						return opts[option];
					}
				}

				console.log(options);
			},

			clearGroup: function(id) {
				if (groups[id]) {
					delete groups[id];
				}
			}
		}
	});
})(jQuery);



gH = (function ($) {
	var g = {},
			scanner = {},
			uploaders = {},
			$ = jQuery,
			hideClass = 'hide',
			imageUrl,
			cacheUrl,
			imageData,
			options;
	/**
	 * This module contains the Javascript for the generation and function of the
	 * Gallery Hierarchy image editor.
	 *
	 * @param obj JQueryDOMObject DOM object for the editor to be appended to
	 * @param file Object Object containing the information on the file
	 */
	var Editor = (function() {
		function drawRow(header, contents) {
			var td, row = $('<tr></tr>');
			if (header) {
				row.append('<th>' + header + '</th>');
			}
			row.append((td = $('<td' + (!header ? ' colspan="2"' : '') + '></td>')));
			
			if (contents.constructor === Array) {
				var i;
				for (i in contents) {
					td.append(contents[i]);
				}
			} else {
				td.append(contents);
			}
	
			return row;
		}
	
		/**
		 * Confirms actions by receiving the POST response
		 */
		function confirmAction(del, data, textStatus, jqXHR) {
			if (data instanceof Object) {
				if (data.error) {
					this.status.html(data.error);
				} else {
					this.status.html(data.msg);
				}
	
				var t = this;
	
				setTimeout(function() {
					if (del) {
						// Delete me
						t.div.remove();
						delete t;
					} else {
						t.status.html('');
					}
				}, 3000);
			}
		}
		
		var Editor = function(obj, file, options) {
			this.obj = obj;
			this.file = file;
			this.options = $.extend({
				editable: true,
				fullImage: false,
				showFileTitle: true,
			}, options);
	
			this.draw();
		};
	
		Editor.prototype = {
			/**
			 * Draws the image editor
			 */
			draw: function() {
				this.parts = {}
				var div, dDiv, iDiv, img;
				
				this.obj.append((div = $('<div></div>')));
				this.div = div;
				div.addClass('gHEditor');
	
				if (this.options.showFileTitle) {
					div.append('<h5>' + this.file.file + '</h5>');
				}
				div.append((iDiv = $('<div></div>')));
				iDiv.append((this.img = $('<img src="'
						+ (this.options.fullImage ? pub.full(this.file.path) 
						: pub.thumbnail(this.file.path)) + '">')));
				div.append((this.details = $('<table></table>')));
	
				// Print details
				// File Name @todo Make so you can change
				// Image Dimensions
				this.details.append(drawRow('Image Dimensions:', 
						this.file.width + 'x' + this.file.height + 'px'));
				// Taken data
				if (this.file.taken) {
					this.details.append(drawRow('Taken:', 
							this.file.taken));
				}
				// Image Title
				this.details.append(drawRow('Title:', 
						(this.title = $('<input type="text" value="'
						+ (this.file.title ? this.file.title : '')
						+ '">'))));
				// Image Comment
				this.details.append(drawRow('Comment:',
						(this.comment = $('<textarea>'
						+ (this.file.comment ? this.file.comment : '') + '</textarea>'))));
				// Image Tags
				this.details.append(drawRow('Tags (comma-separated):', 
						(this.tags = $('<input type="text" value="'
						+ (this.file.tags ? this.file.tags : '')
						+ '">'))));
				// Image Gallery Exclusion
				this.details.append(drawRow('Exclude by Default:', 
						(this.exclude = $('<input type="checkbox"'
						+ ((this.file.exclude && this.file.exclude == '1') ? ' checked'
						: '') + '>'))));
	
	
				// Image Actions
				this.details.append(drawRow(null, [
					(this.saveLink = $('<a>Save</a>')
							.click(this.save.bind(this))),
					(this.removeLink = $('<a>Remove</a>')
							.click(this.remove.bind(this))),
					(this.delLink = $('<a>Delete</a>')
							.click(this.delete.bind(this))),
					(this.status = $('<span></span>'))
				]));
			},
	
			/**
			 * Save edited information back to server
			 */
			save: function() {
				// Build information
				var data = {};
				data[this.file.id] = {
					id: this.file.id,
					title: this.title.val(),
					comment: this.comment.val(),
					tags: this.tags.val().replace(/ *, */, ','),
					exclude: (this.exclude.attr('checked') ? 1 : 0)
				};
	
				$.post(ajaxurl + '?action=gh_save', {a: 'save', data: data},
						confirmAction.bind(this, false));
				this.status.html('Saving...');
			},
	
			/**
			 * Remove the image from the database (but not from the server)
			 */
			remove: function() {
				if (confirm('Image will be removed from the gallery, but not deleted '
						+ 'from the server. Continue?')) {
					$.post(ajaxurl + '?action=gh_save', {a: 'remove', id: this.file.id},
							confirmAction.bind(this, true));
					this.status.html('Removing...');
				}
			},
	
			/**
			 * Remove the image from the database and delete from the server
			 */
			delete: function() {
				if (confirm('Image will be removed from the gallery and deleted from '
						+ 'the server. Continue?')) {
					$.post(ajaxurl + '?action=gh_save', {a: 'delete', id: this.file.id},
							confirmAction.bind(this, true));
					this.status.html('Deleting...');
				}
			},
		};
	
		return Editor;
	})();
	
	

	var uploader = {
		
	};
	
	function addUploadedFile(id, uploader, file, response) {
		console.log('addUploadedFile called');
		// @todo Check for error
	
		if (!uploaders[id]) {
			return;
		}
	
		var data = JSON.parse(response.response);
	
		if (data.error) {
		}
	
		if (data.files) {
			console.log(data.files);
			uploaders[id].browser.displayFiles(data.files, true);
			/*var f, file;
	
			for (f in data.files) {
				file = data.files[f];
	
				switch (file.type) {
					case 'image': // Print the image and information
						new Editor(uploaders[id].uploadedDiv, file);
						break;
				}
			}*/
		}
	}
	
	function checkForUploadDir(id, ev) {
		if (uploaders[id]) {
			ev.preventDefault();
	
			if (!uploaders[id].dirId) {
					ev.stopImmediatePropagation();
					alert("Please choose a directory to upload the files into");
					return false;
			}
			else {
					return true;
			}
		}
	}
	
	function resetUploader(id) {
		if (!uploaders[id]) {
			return;
		}
	
		setTimeout(doUploaderReset.bind(this, id), 2000);
	}
	
	function doUploaderReset(id) {
		uploaders[id].uploader.destroy();
		initUploader(id);
	}
	
	function initUploader(id) {
		uploaders[id].obj.pluploadQueue(uploaders[id].options);
		
		var uploader = uploaders[id].obj.pluploadQueue();
	
		uploaders[id].uploader = uploader;
	
		// Hook function onto start button to stop upload if don't have a
		// destination folder
		var startButton = uploaders[id].obj.find('a.plupload_start');
		startButton.click(checkForUploadDir.bind(this, id));
		
		// Rearrange event handler for start button, to ensure that it has the ability
		// to execute first
		var clickEvents = $._data(startButton[0], 'events').click;
		if (clickEvents.length == 2) clickEvents.unshift(clickEvents.pop());
	
		// Bind to events
		uploader.bind('FileUploaded', addUploadedFile.bind(this, id));
		uploader.bind('UploadComplete', resetUploader.bind(this, id));
	
		// Set dir_id if we have one
		if (uploaders[id].dirId) {
			pub.setUploadDir(id, {id: uploaders[id].dirId});
		}
	}
	

	function updateScanStatus(currentStatus) {
		if (currentStatus.startTime) { // Have scan running
			scanner.status.html('<b>Current scan status: </b>');
	
			scanner.scanBtn.addClass('disabled');
			scanner.fullScanBtn.addClass('disabled');
		} else {
			scanner.status.html('<b>Previous scan\'s last status: </b>');
	
			scanner.scanBtn.removeClass('disabled');
			scanner.fullScanBtn.removeClass('disabled');
		}
		if (currentStatus.status) {
			scanner.status.append(currentStatus.status);
	
			if (currentStatus.time) {
				scanner.status.append(' (' + currentStatus.time + ')');
			}
		} else {
			scanner.status.append('None');
		}
	}
	
	function refreshScanStatus() {
		sendScanCommand('status');
	}
	
	function sendScanCommand(cmd, data) {
		if (!data) {
			data = {};
		}
		data.a = cmd;
	
		if (cmd !== 'status') {
			scanner.status.html('Starting scan... If this message doesn\'t change '
					+ 'you may need to refresh the page.');
		}
	
		$.post(ajaxurl + '?action=gh_scan', data, receiveScanRefresh);
	}
	
	function receiveScanRefresh(data, textStatus, jqXHR) {
		updateScanStatus(data);
	
		// Start update job if have a job currently running
		if (data.startTime) {
			setTimeout(refreshScanStatus, 10000);
		}
	}
	

	var Browser = (function($) {
		//var options;
		//var doms = {};
	
		/**
		 * Handles a change in the number images per page. Hooked onto the onChange
		 * event for the limit input field.
		 */
		function repage() {
			if (this.options.limit !== filesPerPage.call(this)) {
				printFiles.call(this);
			}
		}
	
		/**
		 * Repages the current images when the images per page is changed. Hooked
		 * onto the click events for the next/prev and page links and for the
		 * onChange manual page input field.
		 *
		 * @param step Integer Number of pages to step by. Can be +ve or -ve
		 * @param page Integer Page to skip to (will be ignored if step != 0)
		 */
		function changePage(step, page) {
			// Get value
			var page;
			var currentLimit = filesPerPage.call(this);
			var currentPage = Math.floor(this.currentOffset / currentLimit) + 1;
			var maxPage = Math.floor(len(this.currentFiles) / currentLimit) + 1;
	
			if (step) {
				page = Math.max(1, currentPage + step);
			} else if (page === -1) {
				page = maxPage;
			}
	
			if (!page) {
				if (isNaN(page = parseInt(this.doms.pageNumber.val()))) {
					page = currentPage;
					this.doms.pageNumber.val(page);
				}
			}
	
			page = Math.max(1, Math.min(page, maxPage));
	
			this.doms.pageNumber.val(page);
			
			
			if (page != currentPage) {
				page = (page - 1) * currentLimit;
				printFiles.call(this, page);
			}
		}
	
		function filesPerPage(limit) {
			if (this.doms.limit === undefined) {
				return null;
			}
	
			if (limit !== undefined && !isNaN(limit)) {
				// Set new value
				this.doms.limit.val(limit);
			} else {
				// Get current value or use default
				limit = parseInt(this.doms.limit.val());
	
				if (isNaN(limit)) {
					this.doms.limit.val(this.options.limit);
					return this.options.limit;
				}
			}
	
			return limit;
		}
	
		/**
		 * Draws the current files in the page
		 *
		 * @param id string Id of the current gallery
		 */
		function printFiles(offset) {
			// Stop if we have no images
			if (!this.currentFiles) {
				return;
			}
		
			if (offset !== null && offset !== undefined) {
				this.currentOffset = Math.max(0,
						Math.min(offset, len(this.currentFiles)));
			}
	
			// Wipe the pad
			this.doms.pad.html('');
	
			// Clear fileDoms and shownFiles
			this.fileDoms = {};
			this.shownFiles = {};
	
			var currentLimit = filesPerPage.call(this);
			var end = Math.min(this.currentOffset + currentLimit,
					len(this.currentFiles));
	
			var maxOffsets = Math.floor(len(this.currentFiles) / currentLimit);
			var lastOffset = maxOffsets * currentLimit;
	
			// Displaying number
			this.doms.displaying.html(len(this.currentFiles)
					+ (len(this.currentFiles) > 1 ? ' items' : ' item'));
				
			// Disable First/prev page
			if (this.currentOffset) {
				this.doms.firstPage.removeClass('disabled');
				this.doms.prevPage.removeClass('disabled');
			} else {
				this.doms.firstPage.addClass('disabled');
				this.doms.prevPage.addClass('disabled');
			}
	
			// Current page input and total
			this.doms.pageNumber.val(Math.ceil(this.currentOffset / currentLimit) + 1);
			this.doms.totalPages.html(maxOffsets + 1);
	
			// Disable next/last page
			if (this.currentOffset !== lastOffset) {
				this.doms.nextPage.removeClass('disabled');
				this.doms.lastPage.removeClass('disabled');
			} else {
				this.doms.nextPage.addClass('disabled');
				this.doms.lastPage.addClass('disabled');
			}
	
	
			// Start traversal
			traverse.call(this, this.doms.pad, this.currentFiles, this.currentOffset, end);
		}
	
		/**
		 * Traverses the files and prints
		 *
		 * @param obj JQueryDOMObject Object to append the files to
		 * @param files Object Object containing the files to be printed
		 * @param offset Integer Current offset. Will be checked to see if should
		 *               finish printing
		 *
		 * @returns Integer The new offset
		 */
		function traverse(obj, files, start, end, offset) {
			var f, div;
	
			if (!offset) {
				offset = 0;
			}
	
			for (f in files) {
	
				// Set default type
				if (files[f].type === undefined) {
					files[f].type = this.options.defaultType;
				}
	
				//if (files[f].type == 'folder') {
				if (files[f].files !== undefined) {
					if (offset >= start) {
						this.fileDoms[f] = {};
						// Create a folder div
						obj.prepend($('<div class="folder"></div>')
								.append('<div>' + files[f].name + '</div>')
								.append((this.fileDoms[f].div = $('<div></div>'))));
	
						// Call traverse
						if (files[f].files) {
							traverse(this.fileDoms[f].div, files[f].files, start, end, offset);
						}
					}
	
					offset++;
				} else if (this.options.generators[files[f].type]) {
					if (offset >= start) {
						this.fileDoms[f] = {};
						this.shownFiles[f] = files[f];
						obj.append((this.fileDoms[f].div = $('<div class="file"></div>')));
	
						if (this.options.selection) {
							this.fileDoms[f].div.append($('<div'
									+ (this.options.selectionClass ? ' class="'
									+ this.options.selectionClass + '"' : '') + '>').data(files[f])
									.click(select.bind(this, f, files[f])));
	
							// Select if selected
							if (this.selected[f]) {
								this.fileDoms[f].div.addClass(this.options.selectedClass);
							}
	
							if (this.options.orderedSelection) {
								this.fileDoms[f].div.append($('<div'
										+ (this.options.orderClass ? ' class="'
										+ this.options.orderClass + '"' : '') + '>').data(files[f])
										.append($('<div class="up"></div>').
										click(changeOrder.bind(this, f, -1)))
										.append((
												this.fileDoms[f].order = $('<div class="order"></div>').
										click(promptOrder.bind(this, f))))
										.append($('<div class="down"></div>').
										click(changeOrder.bind(this, f, 1))));
							
								if (this.selected[f]) {
									this.fileDoms[f].order.html(this.selectOrder.indexOf(f) + 1);
								}
								//p.addClass('dashicons dashicons-arrow-left-alt');
								//p.addClass('dashicons dashicons-arrow-right-alt');
							}
						}
	
						if (this.options.exclusion) {
							this.fileDoms[f].div.append($('<div'
									+ (this.options.exclusionClass ? ' class="'
									+ this.options.exclusionClass + '"' : '') + '>').data(files[f])
									.click(exclude.bind(this, f, files[f], undefined)));
	
							// Select if selected
							if (files[f].exclude == '1') {
								this.fileDoms[f].div.addClass(this.options.excludedClass);
							}
	
							if (files[f].excluded) {
								obj.addClass(this.options.excludedClass);
							}
						}
	
						this.options.generators[files[f].type](this.fileDoms[f].div, files[f]);
					}
	
					offset++;
				}
	
				if (offset >= end) {
					return offset;
				}
			}
			
			return offset;
		}
	
		function reorder() {
			var i, id;
	
			for (i in this.selectOrder) {
				id = this.selectOrder[i];
				if (this.fileDoms[id]) {
					this.fileDoms[id].order.html((i*1) + 1);
				}
			}
		}
	
		function select(id, file) {
			var x;
	
			if (this.selected[id]) {
				if ((x = this.selectOrder.indexOf(id)) !== -1) {
					this.selectOrder.splice(x, 1);
				}
				this.fileDoms[id].div.removeClass(this.options.selectedClass);
				if (this.showingCurrent !== false) {
					this.fileDoms[id].selected = false;
				} else {
					delete this.selected[id];
				}
				reorder.call(this);
			} else {
				this.selected[id] = file;
				this.selectOrder.push(id);
				this.fileDoms[id].order.html(this.selectOrder.length);
				this.fileDoms[id].div.addClass(this.options.selectedClass);
				this.fileDoms[id].selected = true;
			}
		
			if (this.options.selection && this.options.selection.call) {
				this.options.selection(this.selectOrder, this.selected);
			}
		}
	
		/**
		 * Toogle/set/unset exclusion of a single file
		 *
		 * @param id {} Id of the file to change the exclusion on
		 * @param file Object Object of the file to change the exclusion on
		 * @param exclude {boolean|undefined} Force exclusion
		 */
		function exclude(id, file, exclude) {
	
			exclude = (exclude === undefined ?
					!this.fileDoms[id].div.hasClass(this.options.excludedClass) : exclude);
	
			if (this.fileDoms[id]) {
				if (exclude) {
					if (!this.fileDoms[id].div.hasClass(this.options.excludedClass)) {
						this.fileDoms[id].div.addClass(this.options.excludedClass);
					}
				} else {
					if (this.fileDoms[id].div.hasClass(this.options.excludedClass)) {
						this.fileDoms[id].div.removeClass(this.options.excludedClass);
					}
				}
			}
	
			this.options.exclusion(id, exclude, file);
		}
	
		/**
		 * Bulk exclude/un-exclude currently selected files
		 *
		 * @param exclude {boolean|undefined} If true, selected will be excluded
		 */
		function excludeSelected(exclude) {
			var f;
	
			for (f in this.selected) {
				exclude.call(this, f, this.selected[f], exclude);
			}
		}
	
		function changeOrder(id, direction) {
			var oldPosition = this.selectOrder.indexOf(id);
	
			var position = Math.max(0, Math.min(oldPosition + direction,
						this.selectOrder.length - 1));
	
			if (oldPosition == -1 || position == oldPosition) {
				return;
			}
	
			this.selectOrder.splice(oldPosition, 1);
			this.selectOrder.splice(position, 0, id);
	
			reorder.call(this);
	
			if (this.options.selection && this.options.selection.call) {
				this.options.selection(this.selectOrder, this.selected);
			}
		}
	
		function promptOrder(id) {
			var position;
			if ((position = prompt('Enter a new position for the file'))
					!== undefined) {
				// Limit position
				position = Math.max(0, Math.min(position -1,
						this.selectOrder.length - 1));
	
				var oldPosition = this.selectOrder.indexOf(id);
	
				if (oldPosition == -1 || position == oldPosition) {
					return;
				}
	
				this.selectOrder.splice(oldPosition, 1);
				this.selectOrder.splice(position, 0, id);
	
				reorder.call(this);
			}
		}
	
		function setCurrentImages(images) {
			var i;
			this.currentFiles = images;
			this.imageIndex = {};
			for (i in this.currentFiles) {
				if (this.currentFiles[i]['id']) {
					this.imageIndex[this.currentFiles[i]['id']] = i;
				}
			}
		}
	
		function toggleSelected(noPrint) {
			var i;
			if (this.showingCurrent !== false) {
				// Clean up unselected
				for (i in this.selected) {
					if (this.selectOrder.indexOf(i) === -1) {
						delete this.selected[i];
					}
				}
				this.currentFiles = this.displayFiles;
				this.currentOffset = this.showingCurrent;
				this.doms.showSelected.html('Show selected');
				this.showingCurrent = false;
			} else {
				this.displayFiles = this.currentFiles;
				this.currentFiles = {};
				//this.imageIndex = {};
				var i;
				for (i in this.selectOrder) {
					this.currentFiles[this.selectOrder[i]] = this.selected[this.selectOrder[i]];
					//this.imageIndex[this.selectOrder[i]] = i;
				}
				this.showingCurrent = this.currentOffset;
				this.currentOffset = 0;
				this.doms.showSelected.html('Hide Selected');
			}
	
			if (!noPrint) {
				printFiles.call(this);
			}
		}
	
		function rebuildIndexes() {
			// Count the number of files excluding folders
		}
	
		function mergeFiles(newFiles, files) {
			if (!this.currentFiles) {
				this.currentFiles = newFiles;
				return;
			}
			if (!files) {
				files = this.currentFiles;
			}
	
			var f;
			for (f in newFiles) {
				if (!files[f]) {
					files[f] = newFiles[f];
				} else {
					// Quick conflict check
					if (files[f].type != newFiles[f].type) {
						// Error?
					}
					
					if (newFiles[f].files) {
						if (!files[f].files) {
							files[f].files = newFiles[f].files;
						} else {
							mergeFiles(newFiles[f].files, files[f].files);
						}
					}
				}
			}
		}
	
		function len(obj) {
			if (!obj) {
				return null;
			}
			if (obj instanceof Array) {
				return obj.length;
			}
	
			if (obj instanceof Object) {
				return Object.keys(obj).length;
			}
		}
	
		/**
		 * Change the currently selected
		 *
		 * @param selection {-1|0|1} Select all (1), none (0), or invert (-1)
		 * @param page {boolean} Whether to only select on current page.
		 */
		function changeSelection(selection, page) {
			var i, f, files;
			if (page) {
				files = this.shownFiles;
			} else {
				files = this.currentFiles;
			}
	
			switch (selection) {
				case 1: // All
					for (f in files) {
						if (!this.selected[f]) {
							this.selected[f] = files[f];
							this.selectOrder.push(f);
							if (this.fileDoms[f])
									this.fileDoms[f].div.addClass(this.options.selectedClass);
						}
					}
					break;
				case 0: // None
					for (f in files) {
						if ((i = this.selectOrder.indexOf(f)) !== -1) {
							this.selectOrder.splice(i, 1);
							delete this.selected[f];
							if (this.fileDoms[f])
									this.fileDoms[f].div.removeClass(this.options.selectedClass);
						}
					}
					break;
				case -1: // Invert Selection
					for (f in files) {
						if ((i = this.selectOrder.indexOf(f)) !== -1) {
							this.selectOrder.splice(i, 1);
							delete this.selected[f];
							if (this.fileDoms[f])
									this.fileDoms[f].div.removeClass(this.options.selectedClass);
						} else {
							this.selected[f] = files[f];
							this.selectOrder.push(f);
							if (this.fileDoms[f])
									this.fileDoms[f].div.addClass(this.options.selectedClass);
						}
					}
					break;
			}
		}
	
		function clearSelection() {
			if (!this.showingCurrent
					|| confirm('Are you sure? Entire current selection will be cleared')) {
				// Clear selected class
				var d;
				for (d in this.fileDoms) {
					this.fileDoms[d].div.removeClass(this.options.selectedClass);
				}
	
				// Clear stores
				this.selected = {};
				this.selectOrder = [];
			}
		}
	
		/**
		 * Prototype for creating a image browser
		 *
		 * @param obj JQueryDOMObject DOM object to append the browser to.
		 * @param options Object Object containing the options to create the browser
		 *             with.
		 * @param files Object Object containing the files to preload into the
		 *               browser.
		 *
		 * The files object should be in the format
		 * {
		 *   'id': {
		 *     file: '',
		 *     type: <'image'|'folder'|'archive'>,
		 *     files: {
		 *       ...
		 *     }
		 *   },
		 *   ...
		 * }
		 *
		 * The object for each file will be linked to the object that the events are
		 * hooked to.
		 *
		 */  
		function Viewer(obj, options, files) {
			if (!obj) {
				throw new Error('Need a real object to put a viewer in');
			}
	
			this.doms = {};
			/// Stores the JQueryDOMObjects of the currently shown files
			this.fileDoms = {};
			/// Stores the currently shown files (excluding folders)
			this.shownFiles = {};
			this.selected = {};
			this.selectOrder = [];
			this.currentFiles = {};
			this.currentOffset = 0;
			this.showingCurrent = false;
	
			this.options = $.extend({
				/** Remember selected images from previous
				 *  groups of images.
				 */
				rememberSelection: true, 
				/**
				 * Class to add to the browser div
				 */
				class: 'gHBrowser',
				/**
				 * Whether or not to create a new div inside the given object for the
				 * browser
				 */
				cleanDiv: false,
				/**
				 * Function to be run when selection is changed
				 */
				selection: null,
				/**
				 * Class to add to the select button div
				 */
				selectionClass: 'select',
				/**
				 * Class to add to selected files
				 */
				selectedClass: 'selected',
				/**
				 * If true, selection will be ordered
				 */
				orderedSelection: false,
				/**
				 * Class to add to the order div
				 */
				orderClass: 'orderer',
				/**
				 * Function to be run when exclusion is changed
				 */
				exclusion: null,
				/**
				 * Class to add to the exclude button div
				 */
				exclusionClass: 'exclude',
				/**
				 * Class to add to excluded files
				 */
				excludedClass: 'excluded',
				/**
				 * Default number of files to show per page
				 */
				limit: 50,
				/**
				 * Functions to use for printing files of different types.
				 * Function will be passed the JQuery DOM object to append the file to
				 * and the object containing the information on the file to print.
				 */
				generators: {
				},
				/**
				 * File type to use if the file does not have a specified type (used
				 * to call the correct html generator for the file.
				 */
				defaultType: 'image',
				/**
				 * @todo Use ordering to order the files - Could be done in PHP
				 */
			}, options);
	
			if (this.options.cleanDiv) {
				obj.append((this.doms.obj = $('<div></div>')));
			} else {
				this.doms.obj = obj;
			}
	
			if (this.options.orderedSelection) {
				this.doms.obj.addClass('ordered');
			}
	
			if (this.options.class) {
				this.doms.obj.addClass(this.options.class);
			}
	
			var select, action;
	
			var i = Math.random().toString(36).substr(2, 9);
			var r = Math.random().toString(36).substr(2, 9);
			// Draw parts
			this.doms.obj
					// Draw pagination etc
					.append($('<div class="tablenav"></div>')
							.append('<label for="' + i + '">Images per page:</label>')
							.append((this.doms.limit = $('<input type="number"  id="'
									+ i + '">').change(repage.bind(this))))
							.append(select = $('<div class="drop">Select</div>')
									.append($('<ul></ul>')
											.append($('<li></li>')
													.append($('<a>all</a>')
															.click(changeSelection.bind(this, 1, true)))
													.append(' / ')
													.append($('<a>none</a>')
															.click(changeSelection.bind(this, 0, true)))
													.append(' on this page / ')
													.append($('<a>invert page selection</a>')
															.click(changeSelection.bind(this, -1, true)))
											)
											.append($('<li></li>')
													.append($('<a>all</a>')
															.click(changeSelection.bind(this, 1, false)))
													.append(' / ')
													.append($('<a>none</a>')
															.click(changeSelection.bind(this, 0, false)))
													.append(' / ')
													.append($('<a>invert</a>')
															.click(changeSelection.bind(this, -1, false)))
											)
									)
							)
							.append($('<div class="drop">With selected</div>').append(
									(actions = $('<ul></ul>'))))
							.append((this.doms.showSelected = $('<span>Show selected</span>')
									.click(toggleSelected.bind(this, false))))
							.append($('<span></span>')
									.append($('<input type="checkbox" id="' + r + '"'
											+ (this.options.rememberSelection ? ' checked' : '')
											+ '>').change((function() {
												this.options.rememberSelection =
														($(this).attr('checked') ? true : false);
											}).bind(this)))
									.append('<label for="' + r + '">Remember selection</label>'))
							.append((this.doms.pages
									= $('<span class="tablenav-pages"></span>')))
					)
					.append((this.doms.pad = $('<div class="browser"></div>')));
	
			// Validate limit
			if (isNaN(this.options.limit)) {
				this.options.limit = 50;
			}
	
			filesPerPage.call(this, this.options.limit);
	
			// Add actions
			// Add exclusion
			actions.append($('<li>Set exclusion</li>')
					.click(excludeSelected.bind(this, true)));
			actions.append($('<li>Unset exclusion</li>')
					.click(excludeSelected.bind(this, false)));
			// Add custom actions
			if (this.options.actions) {
				var a;
				for (a in this.options.actions) {
					actions.append($('<li>' + a + '</li>')
							.click(this.options.actions[a]));
				}
			}
	
			// Displaying number
			this.doms.pages.append((this.doms.displaying = $('<span '
					+ 'class="displaying-num"></span>')));
				
				
			// First page
			this.doms.pages.append((this.doms.firstPage = $('<a class="first-page">'
					+ '&laquo;</a>').click(changePage.bind(this, null, 1))));
	
			// Prev page
			this.doms.pages.append((this.doms.prevPage = $('<a class="prev-page">'
					+ '&lsaquo;</a>').click(changePage.bind(this, -1, null))));
	
			// Current page input and total
			this.doms.pages.append((this.doms.pageNumber = $('<input type="number" '
					+ 'class="current-page" title="Current Page">')
					.change(changePage.bind(this))))
					.append(' of ')
					.append((this.doms.totalPages = $('<span class="total-pages">'
							+ '</span>')));
	
			// Next page
			this.doms.pages.append((this.doms.nextPage = $('<a class="next-page">'
					+ '&rsaquo;</a>').click(changePage.bind(this, 1))));
	
			// Last page
			this.doms.pages.append((this.doms.lastPage = $('<a class="last-page">'
					+ '&raquo;</a>').click(changePage.bind(this, null, -1))));
			
			
			// TODO Add insert class if enabled
			if (this.options.insert) {
				this.doms.pad.addClass('builderOn');
			}
	
			// Hide if don't have images
			if (!files) {
				this.doms.obj.hide();
			} else {
				this.currentFiles = files;
				printFiles.call(this, 0);
			}
		}
	
		Viewer.prototype = {
			/**
			 * Remove file(s) from the stored file(s)
			 * @param fileIds string/array Id(s) of file(s) to remove.
			 */
			removeFile: function(fileIds) {
			},
	
			/**
			 * Display the given files. If currently showing selected files, will
			 * switch to showing the stored images.
			 * @param files {Object} Files to display @see Viewer for format of object
			 * @param append {boolean} If true, append images to the currently displayed
			 *               images
			 * @todo What to do if receive a null for files...?
			 */
			displayFiles: function(files, append) {
				// Show div
				this.doms.obj.show();
	
				if (this.showingCurrent !== false) {
					toggleSelected.call(this, true);
				}
	
				if (append) {
					mergeFiles.call(this, files);
					printFiles.call(this, 0);
				} else {
					this.currentFiles = files;
					
					// Clear selected if not remebering selection
					if (!this.options.rememberSelection) {
						this.selected = {};
						this.selectOrder = [];
					}
					// Reset current offset
					printFiles.call(this, 0);
				}
			},
		}
	
		return Viewer;
	})(jQuery)
	


	$.viewer.option('gHBrowser', {
		generators: {
			imageEditor: displayImageEditor.bind(this),
		},
		scroll: true,
		default: 'imageEditor'
	});

	/**
	 * Create html to display an image into a given JQueryDOMObject
	 *
	 * @param obj JQueryDOMObject JQuery object to put the image into
	 * @param file Object Object containing information on the file
	 */
	function displayImage(id, obj, file) {
		obj.append($('<a href="' + imageUrl + '/' + file.path
				+ '" target="_blank"><img src="'
				+ this.thumbnail(file.path) + '"></a>')
				.viewer(null, 'gHBrowser').data('imageData', file));
	}

	/**
	 * Used to diplay the image editor in the floater window
	 */
	function displayImageEditor(link, objects) {
		var editor = new Editor(objects.div, link.data('imageData'), {
			fullImage: true
		});

		editor.img.load(function() {
			//calculateImageHeight.call(this);
			calculateImageHeight(objects, editor);

			window.addEventListener('resize',
					calculateImageHeight.bind(this, objects, editor));
		}.bind(this));
	}

	/**
	 * Used to resize the image in image editor in the floater so it is the
	 * maximum size possible
	 */
	function calculateImageHeight(objects, editor) {
		var oWidth = editor.img.prop('naturalWidth');
		var oHeight = editor.img.prop('naturalHeight');

		// Start with window width and height minus padding (2*15px)
		var width = window.innerWidth - 40;
		var height = window.innerHeight - 90;

		// Calculate side-by-side
		var sWidth = width - (objects.div.innerWidth() - editor.img.innerWidth());
		var sHeight = height - (objects.div.innerHeight() - editor.img.innerHeight());

		// Calculate on top
		//width -= 

		// Make image best height / width
		if (sWidth >= oWidth && sHeight >= oHeight) {
			editor.img.height(oHeight);
			editor.img.width(oWidth);
		} else if ((sWidth / oWidth) > (sHeight / oHeight)) {
			editor.img.height(sHeight);
			editor.img.width(oWidth / oHeight * sHeight);
		} else {
			editor.img.height(oHeight / oWidth * sWidth);
			editor.img.width(sWidth);
		}
	}

	function gallerySelect(gid, ids, files) {
		g[gid].selectOrder = ids;

		g[gid].idsOnly = (ids.length ? true : false);


		this.redisplayShortcode(gid);
	}

	function galleryExclude(gid, id, excluded, file) {
		// Remove the disabled class from the Save button
		if (g[gid]['saveButton'].hasClass('disabled')) {
			g[gid]['saveButton'].removeClass('disabled');
		}
		
		if (!g[gid].changed[id]) {
			g[gid].changed[id] =  {};
		}

		if (!g[gid].changed[id].exclude) {
			var val = parseInt(file.exclude);
			g[gid].changed[id].exclude = {
				'old': val,
			};
		}
		
		g[gid].changed[id].exclude.new = (excluded ? 1 : 0);
		file.exclude = (excluded ? '1' : '0');
	}

	var pub = {
		init: function(opts) {
			options = opts;
			if (opts.imageUrl) imageUrl = opts.imageUrl;
			if (opts.cacheUrl) cacheUrl = opts.cacheUrl;
		},

		/**
		 * Controls the scanning functionality on the Load Images page.
		 *
		 * @param dom JQueryDOMObject Object to put scanning functionality into
		 * @param currentStatus Object Object containing current status
		 *
		 * @todo add multilingual support
		 */
		scanControl: function(dom, currentStatus) {
			scanner.dom = dom;
			dom.append((scanner.status = $('<p></p>')));
			dom.append((scanner.scanBtn = $('<a class="button">'
					+ 'Rescan Directories' + '</a>')));
			scanner.scanBtn.click(sendScanCommand.bind(this, 'rescan', null));
			dom.append(' ');
			dom.append((scanner.fullScanBtn = $('<a class="button">'
					+ 'Force Rescan of All Images' + '</a>')));
			scanner.fullScanBtn.click(sendScanCommand.bind(this, 'full', null));

			receiveScanRefresh(currentStatus);
		},

		uploader: function(id, obj, options) {
			if (id && obj) {
				uploaders[id] = {
					options: options,
					obj: obj,
					dir_id: false,
					uploadedDiv: $('#' + id + 'uploaded')
				};

				// Create browser for uploaded files
				uploaders[id].browser = new Browser(uploaders[id].uploadedDiv, {
					limit: 50,
					selection: true,
					exclusion: galleryExclude.bind(this, id),
					generators: {
						image: displayImage.bind(this, id)
					}
				});
				
				initUploader(id);
			}
		},

		setUploadDir: function(id, files) {
			if (id && uploaders[id]) {
				// Get folder (only first folder)
				if (files.constructor === Array) {
					files = files[0];
				}
			
				uploaders[id].dirId = files.id;

				// Set the folder parameter on the uploader
				uploaders[id].uploader.setOption('multipart_params', {
					dir_id: files.id
				});
			}
		},

		gallery: function(id, insertOnly) {
			var pad;
			if ((pad = $('#' + id + 'pad'))) {
				g[id] = {
						'insertOnly': insertOnly,
						'builderOn': (insertOnly ? true : false),
						'pad': pad,
						'selected': {}, // Stores the selected images
						'currentImages': null, // Stores the images displayed in pad
						'imageIndex': null, // Used to look an image in currentImages based on its id
						'selectOrder': [], // Stores the order of selected images
						'changed': {}, // Stores any changed information to send to server
						'currentOffset': 0, // Stores the current image offset
						'currentLimit': 0,
						'showingCurrent': false, // False if not or filtered image offset
						'idsOnly': false, // True when only ids should be in shortcode
						'input': $('#' + id + 'input'), // Input field used when inserting into post/page
						'form': $('#' + id + 'form'), // Form used when inserting into post/page
						'folders': [], // Selected folders array
						'foldersChanged': false, // Stores whether the folders have been changed
						'recurse': $('#' + id + 'recurse'), // Recursive checkbox
						'start': $('#' + id + 'start'), // Start date input
						'end': $('#' + id + 'end'), // End date input
						'name': $('#' + id + 'name'), // Name search input
						'title': $('#' + id + 'title'), // Title search input
						'comment': $('#' + id + 'comment'), // Comment
						'tags': $('#' + id + 'tags'),
						'group': $('#' + id + 'group'),
						'class': $('#' + id + 'class'),
						'limit': $('#' + id + 'limit'),
						'includeFilter': $('#' + id + 'includeFilter'),
						'includeExcluded': $('#' + id + 'include_excluded'),
						'sort': $('#' + id + 'sort'),
						'caption': $('#' + id + 'caption'),
						'class': $('#' + id + 'class'),
						'popup_caption': $('#' + id + 'popupCaption'),
						'link': $('#' + id + 'link'),
						'size': $('#' + id + 'size'),
						'type': $('#' + id + 'type'),
						'options': {
								'ghalbum': ['type'],
								'ghimage': ['size'],
						},
						'filter': $('#' + id + 'filter'),
						'filterButton': $('#' + id + 'filterButton'),
						'saveButton': $('#' + id + 'saveButton'),
						'filterLabel': $('#' + id + 'filterLabel'),
						'builder': $('#' + id + 'builder'),
						'builderLabel': $('#' + id + 'builderLabel'),
						'limit': $('#' + id + 'limit'), // Controls # of images per page
						'shortcode': $('#' + id + 'shortcode'),
						'selectedLabel': $('#' + id + 'selectedLabel'),
						'sctype': $('#' + id + 'sctype'),
						'pages': $('#' + id + 'pages'), // Span for page changer
						//'': $('#' + id + ''),
				};

				// Initialise currentLimit
				if (isNaN(g[id]['currentLimit'] = parseInt(g[id]['limit'].val()))) {
					g[id]['currentLimit'] = 50;
					g[id]['limit'].val(50);
				}

				// Initialise datetime fields
				g[id]['start'].datetimepicker({ 
						timeFormat: 'HH:mm',
						dateFormat: 'yy-mm-dd',
						stepMinute: 10,
						controlType: 'select',
						onClose: function(dateText, inst) {
							if (g[id]['end'].val() != '') {
								var testStartDate = g[id]['start'].datetimepicker('getDate');
								var testEndDate = g[id]['end'].datetimepicker('getDate');
								if (testStartDate > testEndDate)
										g[id]['end'].datetimepicker('setDate', testStartDate);
							}
						},
						onSelect: function (selectedDateTime){
							g[id]['end'].datetimepicker('option', 'minDate', g[id]['start'].datetimepicker('getDate') );
						}
				});
				g[id]['end'].datetimepicker({ 
						timeFormat: 'HH:mm',
						dateFormat: 'yy-mm-dd',
						stepMinute: 10,
						controlType: 'select',
						onClose: function(dateText, inst) {
							if (g[id]['start'].val() != '') {
								var testStartDate = g[id]['start'].datetimepicker('getDate');
								var testEndDate = g[id]['end'].datetimepicker('getDate');
								if (testStartDate > testEndDate)
											g[id]['start'].datetimepicker('setDate', testEndDate);
							}
						},
						onSelect: function (selectedDateTime){
							g[id]['start'].datetimepicker('option', 'maxDate', g[id]['end'].datetimepicker('getDate') );
						}
				});

				// Add change event watchers to fields
				g[id]['sctype'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['class'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['group'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['recurse'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['start'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['end'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['name'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['title'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['comment'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['tags'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['includeFilter'].change(pub.redisplayShortcode.bind(this, id));
				g[id]['includeExcluded'].change(pub.redisplayShortcode.bind(this, id));
				//g[id][''].change(pub.redisplayShortcode.bind(this, id));

				g[id].browser = new Browser(pad, {
					selection: gallerySelect.bind(this, id),
					orderedSelection: (true ? true : false),
					exclusion: galleryExclude.bind(this, id),
					limit: 50,
					generators: {
						image: displayImage.bind(this, id),
					}
				});

				this.redisplayShortcode(id);
			}
			
		},

		/**
		 * Used to toggle the visibility of elements.
		 * @param id string Id of the gallery
		 * @param part string Part to toggle
		 * @param label string Label of part toggling
		 * @return boolean Whether the part is showing or not
		 */
		toggle: function(id, part, label, onLabel, offLabel) {
			if(!g[id]) {
				return;
			}

			if (!onLabel) onLabel = 'Show';
			if (!offLabel) offLabel = 'Hide';
			if (g[id] && g[id][part]) {
				if (g[id][part].hasClass(hideClass)) {
					g[id][part].removeClass(hideClass);
					g[id][part + 'Label'].html(offLabel + ' ' + label);
					return true;
				} else {
					g[id][part].addClass(hideClass);
					g[id][part + 'Label'].html(onLabel + ' ' + label);
					return false;
				}
			}
		},

		thumbnail: function(image) {
			return cacheUrl + '/' + image.replace(/\//g, '_');
		},

		full: function(image) {
			return imageUrl + '/' + image;
		},

		/**
		 * Used to submit a new filter if the filter has been updated
		 * since last time.
		 */
		filter: function(id) {
			if(!g[id]) {
				return;
			}

			if (!g[id]['query']) {
				g[id]['query'] = {
						'folders': [],
						'recurse': 0,
						'start': '',
						'end': '',
						'name': '',
						'title': '',
						'comment': '',
						'tags': ''
				};
			}

			// Go through and see if it is the same query as last
			var p, v, i;
			var changed = false;
			for (p in g[id]['query']) {
				if (p == 'folders') {
					if (g[id].foldersChanged) {
						g[id].query[p] = g[id].folders;
						changed = true;
						g[id].foldersChanged = false;
					}
				} else if (g[id][p].prop('type') == 'checkbox') {
					v = g[id][p].prop('checked');
					if (v && !g[id]['query'][p]) {
						g[id]['query'][p] = 1;
						changed = true;
					} else if (!v && g[id]['query'][p]) {
						g[id]['query'][p] = 0;
						changed = true;
					}
				} else if (g[id]['query'][p] != (v = g[id][p].val())) {
					g[id]['query'][p] = v;
					changed = true;
				}
			}

			if (changed) {
				/// @todo Add localisation
				g[id]['filterButton'].html('Loading...');
				$.post(ajaxurl + '?action=gh_gallery', g[id]['query'],
						this.receiveImages.bind(this, id));
			}
		},

		toggleBuilder: function (id) {
			if(!g[id]) {
				return;
			}

			/// @todo Add localisation
			if (!g[id]['insertOnly']) {
				if ((g[id]['builderOn'] = this.toggle(id, 'builder', 'shortcode builder', 'Enable', 'Disable'))) {
					g[id]['pad'].addClass('builderOn');
				} else {
					g[id]['pad'].removeClass('builderOn');
				}
			} else {
				this.toggle(id, 'builder', 'shortcode options');
			}
		},

		receiveImages: function (id, data, textStatus, jqXHR) {
			if(!g[id]) {
				return;
			}

			if (data.error) {
				alert(data.error);
				return;
			}
			
			// Remap data
			var i, images = {};
			for (i in data) {
				images[data[i].id] = data[i];
			}

			/// @todo Add localisation
			g[id]['filterButton'].html('Filter');

			g[id].browser.displayFiles(images);

			g[id]['idsOnly'] = false;
			this.redisplayShortcode(id);
		},

		/**
		 * Submits the insert form to insert images into the post/page.
		 */
		insert: function(id) {
			if(!g[id]) {
				return;
			}
			
			var code = this.gatherShortcodeData(id);

			if (g[id]['input'].length !== 0) {
				g[id]['input'].val(JSON.stringify(code));
				g[id]['form'].submit();
			}
		},

		clearSelected: function(id) {
			if(!g[id]) {
				return;
			}

			if (g[id]['selectOrder']) {
				var i, iId;
				
				if (g[id]['showingCurrent'] === false) {
					for (i in g[id]['selectOrder']) {
						iId = g[id]['selectOrder'][i];
						if (g[id]['imageIndex'][iId]) {
							iId = g[id]['imageIndex'][iId];
							g[id]['currentImages'][iId]['div'].removeClass('selected');
						}
					}
				}

				g[id]['selectOrder'] = [];
				g[id]['selected'] = {};

				if (g[id]['showingCurrent'] !== false) {
					this.toggleSelected(id);
				}

				g[id]['idsOnly'] = false;
				this.redisplayShortcode(id);
			}
		},

		order: function(id, i, add) {
			if(!g[id]) {
				return;
			}

			if (add !== -1 && add !== 1) {
				return;
			}
			if (g[id]['currentImages'][i]) {
				var iId = g[id]['currentImages'][i]['id'];
				var o = g[id]['selectOrder'].indexOf(iId);
				if ((add === -1 && o === 0) || (add === 1 && o === (g[id]['selectOrder'].length) - 1)) {
					return;
				}
				var oId = g[id]['selectOrder'][o + add];
				g[id]['selectOrder'][o + add] = g[id]['selectOrder'][o];
				g[id]['selectOrder'][o] = oId;
				if (g[id]['imageIndex'][oId] && g[id]['currentImages'][g[id]['imageIndex'][oId]]) {
					g[id]['currentImages'][g[id]['imageIndex'][oId]]['order'].html(o + 1);
				}
				g[id]['currentImages'][i]['order'].html(o + add + 1);
				
				this.redisplayShortcode(id);
			}
		},

		/**
		 * Retrieves shortcode data
		 */
		gatherShortcodeData: function(id) {
			if(!g[id]) {
				return;
			}

			var code = {
					code: g[id]['sctype'].val()
			};

			// Add selected ids
			if (g[id]['selectOrder'].length) {
				code['ids'] = g[id]['selectOrder'];
			}

			// Add filter
			if (!g[id]['idsOnly'] || g[id]['includeFilter'].attr('checked')) {
				// Folders
				if (g[id].folders.length) {
					code['folders'] = g[id].folders;
				}

				// Date
				code['start'] = g[id]['start'].val();
				code['end'] = g[id]['end'].val();

				var P = ['name', 'title', 'comment', 'tags'];
				for (p in P) {
					if ((part = g[id][P[p]].val())) {
						code[P[p]] = part;
					}
				}
			}
			
			// Check include excluded
			if (g[id].includeExcluded.attr('checked')) {
				code.include_excluded = 1;
			}


			var o, O = ['class', 'group'];
			for (o in O) {
				if ((part = g[id][O[o]].val())) {
					code[O[o]] = part;
				}
			}
		
			return code;
		},

		changeFolder: function(id, files) {
			if (!g[id]) {
				return;
			}

			// Restart array
			g[id].folders = [];
			g[id].foldersChanged = true;

			var f;
			for (f in files) {
				g[id].folders.push(files[f].id);
			}

			pub.redisplayShortcode(id);
		},

		/**
		 * Compiles the shortcode based on the information available
		 *
		 * @param id string The id of the gallery.
		 * @todo Add additional options to shortcode
		 */
		compileShortcode: function(id) {
			if(!g[id]) {
				return;
			}
		
			var code = this.gatherShortcodeData(id);

			var filter = [];

			// Add selected ids
			if (code['ids']) {
				filter = code['ids'].slice(0);
			}

			// Add filter
			if (!g[id]['idsOnly'] || g[id]['includeFilter'].attr('checked')) {
				// Folders
				if (code['folders']) {
					filter.push((g[id].recurse.attr('checked') ? 'r' : '')
							+ 'folder=' + code['folders'].join('|'));
				}

				// Date
				var start = code['start'];
				var end = code['end'];

				if (start || end) {
					filter.push('taken=' + (start ? start : '') + '|' + (end ? end : ''));
				}

				var part;
				var P = ['name', 'title', 'comment', 'tags'];
				for (p in P) {
					if ((part = code[P[p]])) {
						filter.push(P[p] + '=' + part);
					}
				}
			}

			var others = [];
			var val, o, O = ['class', 'group', 'include_excluded'];
			for (o in O) {
				if ((val = code[O[o]])) {
					others.push(O[o] + '="' + val + '"');
				}
			}

			return '[' + code.code
					+ (filter.length ? ' id="' + filter.join(',') + '"' : '') 
					+ (others.length ? ' ' + others.join(' ') : '') + ']';
		},

		redisplayShortcode: function(id) {
			if(!g[id]) {
				return;
			}

			g[id]['shortcode'].html(this.compileShortcode(id));
		},

		/**
		 * Sends data back to the server to be saved
		 */
		save: function(id) {
			if(!g[id]) {
				return;
			}

			var i, v, data = {}, change = false;
			for (i in g[id]['changed']) {
				for (v in g[id]['changed'][i]) {
					if (g[id]['changed'][i][v]['new'] !== g[id]['changed'][i][v]['old']) {
						if (!data[i]) {
							data[i] = {}
						}
						data[i][v] = g[id]['changed'][i][v]['new'];
						change = true;
					}
				}
			}
			
			if (change) {
				// @todo Add localisation
				g[id]['saveButton'].html('Saving...');
				$.post(ajaxurl + '?action=gh_save', {a: 'save', data: data},
						this.confirmSave.bind(this, id));
			}
		},

		confirmSave: function(id, data, textStatus, jqXHR) {
			if(!g[id]) {
				return;
			}

			if (!(data instanceof Object) || data.error) {
				alert(data.error);
			} else {
				// TODO Apply changes??
				g[id]['changed'] = {};
				alert(data.msg);
			}
			// @todo Add localisation
			g[id]['saveButton'].html('Save Image Changes');
			g[id]['saveButton'].addClass('disabled');
		},
	};

	return pub;
})(jQuery);

