<?php
require_once("config.inc.php");
require_once("Class.Parser.php");
require_once("Class.Buffer.php");

$buffer = new Buffer($config);

if (empty($_GET['do'])) {
	$buffer->throwError();
}

switch ($_GET['do']) {
	case 'closestupdate':	
		if (empty($_GET['time'])) $buffer->throwError();
		else echo $buffer->getClosestData($_GET['time']);
	break;
	case 'lastbatch':
		if (empty($_GET['time'])) $buffer->throwError();
		else echo $buffer->getLastBatch($_GET['time']);
	break;
	case 'time':
		$date = date_create();
		echo json_encode(array("time"=>date_timestamp_get($date)));
	break;
	case 'lastupdate':
		echo $buffer->getOldestData();
	break;
	default:
		$buffer->throwError();
	break;
}


$buffer->cleanUp();
?>