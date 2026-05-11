<?php

return [
    'host'         => env('ELASTICSEARCH_HOST', 'zslab_elasticsearch'),
    'port'         => env('ELASTICSEARCH_PORT', 9200),
    'scheme'       => env('ELASTICSEARCH_SCHEME', 'http'),
    'index_prefix' => env('ELASTICSEARCH_INDEX_PREFIX', 'lms_'),
];
