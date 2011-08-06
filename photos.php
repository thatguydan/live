<?php
require_once("config.inc.php");
require_once("Class.Parser.php");
require_once("Class.Buffer.php");

$buffer = new Buffer($config);

$res = opendir("images/");
while ($file = readdir($res)) {
	if ($file =="." || $file =="..") continue;
	$data =  exif_read_data("images/$file");
	$time = @strtotime($data["DateTimeOriginal"]);
	$latlongs = $buffer->getClosestLatLng($time);
	$in = array(
		'photo_name' => $file,
		'time' => $latlongs[0]['timestamp']
	);
	$buffer->AppendDBWithPhotos($in);
}


?>