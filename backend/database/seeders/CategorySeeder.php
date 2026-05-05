<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // 학점은행제
            ['code' => 'cb_it',     'name' => 'IT·컴퓨터',   'slug' => 'credit-it',       'order_no' => 1],
            ['code' => 'cb_biz',    'name' => '경영·회계',    'slug' => 'credit-biz',      'order_no' => 2],
            ['code' => 'cb_social', 'name' => '사회복지',     'slug' => 'credit-social',   'order_no' => 3],
            // 자격증
            ['code' => 'cert_it',   'name' => 'IT 자격증',    'slug' => 'cert-it',         'order_no' => 1],
            ['code' => 'cert_fin',  'name' => '금융·회계 자격증', 'slug' => 'cert-finance', 'order_no' => 2],
            ['code' => 'cert_lang', 'name' => '어학 자격증',  'slug' => 'cert-language',   'order_no' => 3],
        ];

        foreach ($categories as $data) {
            Category::firstOrCreate(['code' => $data['code']], $data);
        }
    }
}
