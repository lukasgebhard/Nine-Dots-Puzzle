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
    // The current plugin version.
    static $plugin_version = '1.0';

    // The WordPress-internal plugin ID.
    static $plugin_id = 'mrkojo-nine-dots-puzzle';

    // The file name of the JavaScript.
    static $script_name = 'nine-dots-puzzle.js';

    // The WordPress shortcode used to insert the puzzle into a page/post/widget.
    static $shortcode = 'nine-dots-puzzle';

    // <true> if the JavaScript should be referenced in the generated HTML.
    // This is only the case if the JavaScript is actually needed, 
    // i.e., if the shortcode is detected in a WordPress page/post/widget.
    static $enqueue_script = false;

    // The id attribute of the generated HTML5 canvas element.
    // If this is changed, it has to be changed in the JavaScript, too.
    static $canvas_id = 'canvas-nine-dots-puzzle';

    // The default configuration.
    // I.e., the parameters used if not specified via the shortcode.
    static $default_config = array (
        'size'                          => '250px',
        'show_hint_button_after_round'  =>  2,
        'text_button_hint'              => 'Hint',
        'text_hint'                     => 'Think outside the box.',
        'colour_background'             => 'rgb(0, 0, 128)',
        'colour_neutral'                => 'rgb(153, 221, 255)',
        'colour_success'                => 'rgb(0, 128, 0)',
        'colour_fail'                   => 'rgb(179, 0, 0)',
        'colour_face'                   => 'rgb(255, 217, 26)',
        'colour_text'                   => 'white',
        'colour_text_background_dark'   => 'rgb(51, 51, 51)',
        'colour_text_background_light'  => 'rgb(115, 115, 115)'
    );

    // Return an HTML string representing a HTML5 canvas element.
    // The shortcode arguments are respresented as HTML5 data-* attributes.
    static function handle_shortcode( $atts, $content = null )
    {
        // Shortcode not allowed in feeds
        if ( is_feed() ) return '';

        self::$enqueue_script = true;
        $atts = shortcode_atts( self::$default_config, $atts );
        extract( $atts );

        $html = '<canvas ';
        $html .= 'id="' . self::$canvas_id . '" ';
        $html .= 'width="' . $size . '" ';
        $html .= 'height="' . $size . '" ';
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

    // Ensure that WordPress does not texturize the shortcode.
    static function no_texturize_shortcode($shortcodes)
    {
        $shortcodes[] = self::$shortcode;
        return $shortcodes;
    }

    // Introduce the JavaScript to WordPress.
    static function register_script()
    {
        wp_register_script( $plugin_id, plugins_url( self::$script_name, __FILE__ ), array(), $plugin_version, true );
    }

    // Tell WordPress to reference the JavaScript in the HTML footer.
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
        add_filter( 'widget_text', 'do_shortcode', 11 ); // Enable shortcode in text widgets.
        add_filter( 'no_texturize_shortcodes', array( __CLASS__, 'no_texturize_shortcode' ) );
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_script' ) );
        add_action( 'wp_footer', array( __CLASS__, 'enqueue_script' ) );
    }
}

MrKojoNineDotsPuzzle::init();
