<?php
/**
Plugin Name: Gallery Hierarchy
Plugin URI: http://www.meldce.com/gallery-hierarchy
Version: 0.2.0
Description: A simple image gallery where images are stored in hierarchical folders.
Author: Meld Computer Engineering
Author URI: http://www.meldce.com
Text Domain: gallery-hierarchy
Tags: wordpress,gallery,images,hierarchy,photo,shortcode,filter,search,browser,upload
Licence: GPL-3.0
*/
?>
<?php
if (!class_exists('GHierarchy')) {
	require_once('lib/GHierarchy.php');
	require_once('lib/GHAlbum.php');
	require_once('lib/utils.php');

	function gHierarchySetup() {
		// Include so we have access to is_plugin_active
		//if (!is_admin()) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php');
		//}

		if (is_plugin_active('gallery-hierarchy/gallery-hierarchy.php')) {
			// Include album files
			gHIncludeFiles(plugin_dir_path(__FILE__) . 'albums/');

			// Check database version is correct
			GHierarchy::checkDatabase();

			// Shortcodes
			add_shortcode('ghalbum', array('GHierarchy', 'doShortcode'));
			add_shortcode('ghthumb', array('GHierarchy', 'doShortcode'));
			add_shortcode('ghimage', array('GHierarchy', 'doShortcode'));
			
			add_action('wp_enqueue_scripts', array('GHierarchy', 'enqueue'));
			add_action('admin_enqueue_scripts', array('GHierarchy', 'adminEnqueue'));
			add_action('admin_print_scripts', array('GHierarchy', 'adminPrintInit'));

			add_action('wp_head', array('GHierarchy', 'head'));
			add_action('admin_head', array('GHierarchy', 'head'));

			// Handle AJAX requests (from image browser)
			add_action('wp_ajax_gh_gallery', array('GHierarchy', 'ajaxGallery'));
			add_action('wp_ajax_gh_save', array('GHierarchy', 'ajaxSave'));
			// Handle folder request
			add_action('wp_ajax_gh_folder', array('GHierarchy', 'ajaxFolder'));
			add_action('wp_ajax_gh_scan', array('GHierarchy', 'ajaxScan'));
			add_action('wp_ajax_gh_upload', array('GHierarchy', 'ajaxUpload'));
		
			if (is_admin()) {
				// Initialise
				add_action('init', array('GHierarchy', 'adminInit'));

				add_filter('media_upload_tabs', array('GHierarchy', 'uploadTabs'));
			}
		}
	}

	// Add links to plugin meta
	add_filter( 'plugin_row_meta', array('GHierarchy', 'pluginMeta'), 10, 2);

	add_action('plugins_loaded', 'gHierarchySetup');
	
	//add_action('media_upload_ghierarchy', 'gHierarchyAddMediaTab');
	add_action('media_upload_ghierarchy', array('GHierarchy', 'addMediaTab'));

	// Action for rescan job
	add_action('gh_rescan', array('GHierarchy', 'scan'));

	/// @todo Add a hook for plugin deletion
	register_activation_hook(__FILE__, array('GHierarchy', 'install'));
}
?>
