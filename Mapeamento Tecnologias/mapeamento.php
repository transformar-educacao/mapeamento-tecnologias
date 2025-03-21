<?php
    /*
Plugin Name: Mapeamento Plugin
Description: Incorpora os Mapeamentos em uma página do WordPress.
Version: 1.0
Author: Matheus Pinho (Gerência de Tecnologias e Desenhos Educacionais - SENAC DN)
*/

function mapeamento_shortcode() {
    $game_url = plugins_url('index.html', __FILE__);

    // HTML para incorporar o jogo usando um iframe
    ob_start();
    ?>
    <iframe id="unityContainer" src="<?php echo esc_url($game_url); ?>" style="width: 100%; height: 100vh; border: none;"></iframe>
    <?php
    return ob_get_clean();
}
add_shortcode('mapeamento', 'mapeamento_shortcode');

?>