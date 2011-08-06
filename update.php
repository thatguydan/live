<?php
require_once("config.inc.php");
require_once("Class.Parser.php");
require_once("Class.Buffer.php");


$buffer = new Buffer($config);
$buffer->cleanTable();
$buffer->setData();
echo "Updating database...";
$buffer->appendDB();
echo "done\n";
$buffer->cleanUp();

?>