<?php

namespace App\Services;

use Elastic\Elasticsearch\ClientBuilder;
use Elastic\Elasticsearch\Client;

class ElasticsearchServiceLegacy
{
    private Client $client;
    private string $prefix;

    public function __construct()
    {
        $host = config('elasticsearch.host', 'zslab_elasticsearch');
        $port = config('elasticsearch.port', 9200);
        $scheme = config('elasticsearch.scheme', 'http');

        $this->client = ClientBuilder::create()
            ->setHosts(["$scheme://$host:$port"])
            ->build();

        $this->prefix = config('elasticsearch.index_prefix', 'lms_');
    }

    public static function isEnabled(): bool
    {
        return (bool) config('elasticsearch.enabled', true);
    }

    public function index(string $index, string|int $id, array $body): void
    {
        $this->client->index([
            'index' => $this->prefix . $index,
            'id'    => (string) $id,
            'body'  => $body,
        ]);
    }

    public function delete(string $index, string|int $id): void
    {
        try {
            $this->client->delete([
                'index' => $this->prefix . $index,
                'id'    => (string) $id,
            ]);
        } catch (\Throwable) {
            // 이미 없으면 무시
        }
    }

    public function search(string $index, array $query): array
    {
        $response = $this->client->search([
            'index' => $this->prefix . $index,
            'body'  => $query,
        ]);

        return $response->asArray();
    }

    public function ensureIndex(string $index, array $mappings): void
    {
        $fullIndex = $this->prefix . $index;
        $exists = $this->client->indices()->exists(['index' => $fullIndex]);

        if (!$exists->asBool()) {
            $this->client->indices()->create([
                'index' => $fullIndex,
                'body'  => [
                    'settings' => [
                        'analysis' => [
                            'analyzer' => [
                                'korean' => [
                                    'type'      => 'custom',
                                    'tokenizer' => 'standard',
                                    'filter'    => ['lowercase'],
                                ],
                            ],
                        ],
                    ],
                    'mappings' => $mappings,
                ],
            ]);
        }
    }
}
