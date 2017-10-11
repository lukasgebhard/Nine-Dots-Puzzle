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

	static function register_script()
	{
		wp_register_script( $pluginName, plugins_url( 'nine-dots-puzzle.js', __FILE__ ), array(), $pluginVersion, true );
		//error_log('     register          ', 3, '/tmp/nine-dots-puzzle-errors.log');
	}

	static function enqueue_script()
	{
		wp_enqueue_script( self::$pluginName, plugins_url( 'nine-dots-puzzle.js', __FILE__ ), array(), self::$pluginVersion, true );
		//error_log('     enqueue     ', 3, '/tmp/nine-dots-puzzle-errors.log');
	}

	static function init()
	{
		
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_script' ) );
	
			

		
	}
}

MrKojoNineDotsPuzzle::init();

