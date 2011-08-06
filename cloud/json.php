<?php

require_once("config.inc.php");
require_once("Class.Parser.php");
require_once("Class.Buffer.php");


$buffer = new Buffer($config);
echo $buffer->getJSON();
$buffer->cleanUp();
?>