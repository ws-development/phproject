<?php

namespace Controller;

class Admin extends Base {

	public function index($f3, $params) {

		echo \Template::instance()->render("admin/index.html");

	}

}