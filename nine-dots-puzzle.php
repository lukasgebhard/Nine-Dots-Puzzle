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
	static $plugin_version = '1.0';
	static $plugin_name = 'mrkojo-nine-dots-puzzle';
	static $script_name = 'nine-dots-puzzle.js';
	static $shortcode = 'nine-dots-puzzle';
	static $enqueue_script = false;
	static $canvas_id = 'canvas-nine-dots-puzzle';
	static $default_config = array (
		'canvas_size'			=> '250px',
		'show_hint_button_after_round'	=>  2,
		'text_button_hint'		=> 'Hint',
		'text_hint'			=> 'Think outside the box.',
		'colour_background'		=> 'rgb(153, 221, 255)',
		'colour_neutral'		=> 'rgb(0, 0, 128)',
		'colour_success'		=> 'rgb(0, 128, 0)',
		'colour_fail'			=> 'rgb(230, 46, 0)',
		'colour_face'			=> 'rgb(255, 217, 26)',
		'colour_text'			=> 'white',
		'colour_text_background_dark'	=> 'rgb(51, 51, 51)',
		'colour_text_background_light'	=> 'rgb(115, 115, 115)'
	);

	static function handle_shortcode( $atts, $content = null )
	{
		// Shortcode not allowed in feeds
		if ( is_feed() ) return '';

		self::$enqueue_script = true;
		$atts = shortcode_atts( self::$default_config, $atts );
		extract( $atts );

		$html = '<canvas ';
		$html .= 'id="' . self::$canvas_id . '" ';
		$html .= 'width="' . $canvas_size . '" ';
		$html .= 'height="' . $canvas_size . '" ';
		$html .= 'data-show_hint_button_after_round="' . $show_hint_button_after_round . '" ';
		$html .= 'data-text_button_hint="' . $text_button_hint . '" ';
		$html .= 'data-text_hint="' . $text_hint . '" ';
		$html .= 'data-colour_background="' . $colour_background . '" ';
		$html .= 'data-colour_neutral="' . $colour_neutral . '" ';
		$html .= 'data-colour_success="' . $colour_success. '" ';
		$html .= 'data-colour_fail="' . $colour_fail . '" ';
		$html .= 'data-colour_face="' . $colour_face . '" ';
		$html .= 'data-colour_text="' . $colour_text . '" ';
		$html .= 'data-colour_text_background_dark="' . $colour_text_background_dark . '" ';
		$html .= 'data-colour_text_background_light="' . $colour_text_background_light . '" ';
		$html .= '></canvas>';
		return $html; 
	}

	static function no_texturize_shortcode($shortcodes)
	{
		$shortcodes[] = self::$shortcode;
		return $shortcodes;
	}

	static function register_script()
	{
		wp_register_script( $pluginName, plugins_url( self::$script_name, __FILE__ ), array(), $plugin_version, true );
		//error_log('     register          ', 3, '/tmp/nine-dots-puzzle-errors.log');
	}

	static function enqueue_script()
	{
		if (self::$enqueue_script)
		{
			wp_enqueue_script( self::$plugin_name, plugins_url( self::$script_name, __FILE__ ), array(), self::$plugin_version, true );
		}
	}

	static function init()
	{
		add_shortcode( self::$shortcode, array( __CLASS__, 'handle_shortcode' ) );
		add_filter( 'widget_text', 'do_shortcode', 11 );
		add_filter( 'no_texturize_shortcodes', array( __CLASS__, 'no_texturize_shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_script' ) );
		add_action( 'wp_footer', array( __CLASS__, 'enqueue_script' ) );
	}
}

MrKojoNineDotsPuzzle::init();

