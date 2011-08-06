<?php
//error_reporting(E_ERROR | E_WARNING | E_PARSE);
Class Buffer extends Parser
{
	private $params;
	private $buffer;
	private $link;
	
	public function __construct($config_params) {
		$this->params = $config_params;
		self::initDB();
	}
	
	private function initDB() {
		$link = mysql_connect($this->params['host'], $this->params['user'], $this->params['pass']);
		if (!$link) self::throwError("Could not connect to database.\n");
		else {
			if (!mysql_select_db($this->params['database'], $link)) self::throwError("Could not use database.\n");
			else $this->link =& $link;
		}
	}
	
	public function cleanUp() {
		@mysql_close($this->link);
	}
	
	public function appendDB() {
		/*
		$table = $this->params['table'];
		$result = $this->queryDB ("SELECT * FROM $table ORDER BY id DESC LIMIT 1");
		$data = array_pop(parent::getData());
		if (mysql_num_rows($result) > 0) {
			$row = mysql_fetch_assoc($result);
			$i = 0;
			$recording = false;
			$insertMe = array();
			foreach ($data as $val) {
				if ($recording == true) $insertMe[$i++] = $val;
				elseif ($val['time'] == $row['timestamp']) {
					$recording = true;
					$insertMe[$i++] = $val;
				}
				else continue;
			}
   			if (count($insertMe) > 0) $this->insertData($insertMe);
		}
		else $this->insertData($data);	// This should only fire the first time we populate the database*/
		$data = parent::getData();
		$meta = array_pop($data);
		$this->insertData($data);
	}
	
	public function cleanTable() {
		@mysql_query("TRUNCATE TABLE log;", $this->link);
	}
	
	private function insertData ($newData) {
		$table = $this->params['table'];	
		//mysql_query("set global max_allowed_packet = 500 * 1024 * 1024");
		$query = "INSERT IGNORE INTO $table (`timestamp`, `speed`, `batterypower`, `arraypower`, `motorpower`, `motortemp`, `heatsinktemp`, `latitude`, `longitude`) VALUES ";
		foreach ($newData as $val) {
			$query .= "('".$val['timestamp']."', '".$val['speed']."', '".$val['batterypower']."', '".$val['arraypower']."', '".$val['motorpower']."', '".$val['motortemp']."', '".$val['heatsinktemp']."', '".$val['latitude']."', '".$val['longitude']."'),";
		}	
		$query{strlen($query)-1} = ";";
		//echo $query;
		file_put_contents("sql.sql",$query);
		$this->queryDB($query);
	}
	
	
	private function queryDB ($query) {
		if (!($result = mysql_query($query, $this->link))) self::throwError("Could not query:".mysql_error()."\n");	
		else return $result;	
	}
	
	private function getRows ($result) {
		while ($row = mysql_fetch_assoc($result)) {
			$out[] = $row;
		}
		return $out;
	}
	
	public function getJSON() {
		$table = $this->params['table'];
		$query = "SELECT * FROM $table WHERE speed BETWEEN 1 AND 95 AND timestamp>'1294351243.77' ORDER BY timestamp ASC";
		$result = $this->queryDB($query);
		return json_encode($this->getRows($result));
	}
	
	public function getClosestData ($timestamp) {
		$table = $this->params['table'];
		$time = mysql_real_escape_string($timestamp);
		$query = "SELECT * FROM $table WHERE timestamp < $time AND speed BETWEEN 1 AND 95 ORDER BY timestamp ASC LIMIT 1";
		$result = $this->queryDB($query);
		return json_encode($this->getRows($result));		
	}
	
	public function getLastBatch($since) {
		$table = $this->params['table'];
		$time = mysql_real_escape_string($since);
		$query = "SELECT * FROM $table WHERE timestamp > $time AND speed BETWEEN 1 AND 95 ORDER BY timestamp ASC LIMIT 30";
		$result = $this->queryDB($query);
		return json_encode($this->getRows($result));
	}
	
	public function getOldestData() {
		$table = $this->params['table'];
		$query = "SELECT * FROM $table ORDER BY timestamp DESC LIMIT 1";
		$result = $this->queryDB($query);
		return json_encode($this->getRows($result));	
	}
	
	public function getClosestLatLng($timestamp) {
		$table = $this->params['table'];
		$query = "SELECT latitude,longitude,timestamp FROM $table WHERE timestamp < $timestamp ORDER BY timestamp DESC LIMIT 1";
		
		$result = $this->queryDB($query);
		return $this->getRows($result);		
	}
	
	public function AppendDBWithPhotos($data) {
		$table = $this->params['table'];
			$sql = "UPDATE $table SET photo = '".mysql_real_escape_string($data['photo_name'])."' WHERE timestamp = '".mysql_real_escape_string($data['time'])."'";
			//echo $sql."\n";
			$result = $this->queryDB($sql);

	}
	
	public function throwError ($msg) {
		//header("Status: 400 Bad Request");
		die($msg);
	}
}
?>