<?php
/*
Plugin Name: Nine Dots Puzzle
Plugin URI: https://github.com/mr-kojo/Nine-Dots-Puzzle
Description: The famous Nine Dots Puzzle. Think outside the box!
Version: 1.0
Author: Lukas Gebhard
Author URI: https://github.com/mr-kojo
License: MIT
License URI: https://opensource.org/licenses/MIT
 */

class MrKojoNineDotsPuzzle 
{
	static $pluginVersion = '1.0';
	static $pluginName = 'mrkojo-nine-dots-puzzle';
	static $enqueueScript = false;

	static function handle_shortcode()
	{
		// Shortcode not allowed in feeds
		if ( is_feed() ) return '';

		$html = '<canvas id="canvas-nine-dots-puzzle" width="150px" height="150px"></canvas>';

		self::$enqueueScript = true;

		return $html; 
	}

	static function register_script()
	{
		wp_register_script( $pluginName, plugins_url( 'nine-dots-puzzle.js', __FILE__ ), array(), $pluginVersion, true );
		//error_log('     register          ', 3, '/tmp/nine-dots-puzzle-errors.log');
	}

	static function enqueue_script()
	{
		if (self::$enqueueScript)
		{
			wp_enqueue_script( self::$pluginName, plugins_url( 'nine-dots-puzzle.js', __FILE__ ), array(), self::$pluginVersion, true );
		}
	}

	static function init()
	{
		add_shortcode( 'nine-dots-puzzle', array( __CLASS__, 'handle_shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_script' ) );
		add_action( 'wp_footer', array( __CLASS__, 'enqueue_script' ) );
	}
}

MrKojoNineDotsPuzzle::init();

