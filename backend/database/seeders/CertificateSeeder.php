<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\Course;
use Illuminate\Database\Seeder;

class CertificateSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'code'   => 'CERT-IPQ',
                'name'   => '정보처리기사 수료 자격증',
                'issuer' => 'zslab Academy',
                'slug'   => 'ipq-pass',
            ],
            [
                'code'   => 'CERT-SQLD',
                'name'   => 'SQLD SQL 개발자 수료 자격증',
                'issuer' => 'zslab Academy',
                'slug'   => 'sqld-pass',
            ],
            [
                'code'   => 'CERT-TOEIC',
                'name'   => 'TOEIC 900+ 수료 자격증',
                'issuer' => 'zslab Academy',
                'slug'   => 'toeic-900',
            ],
            [
                'code'   => 'CERT-CPA-JR',
                'name'   => '재경관리사 단기 완성 수료 자격증',
                'issuer' => 'zslab Academy',
                'slug'   => 'cpa-junior-pass',
            ],
            [
                'code'   => 'CERT-JLPT',
                'name'   => 'JLPT N2 합격 수료 자격증',
                'issuer' => 'zslab Academy',
                'slug'   => 'jlpt-n2',
            ],
        ];

        foreach ($items as $item) {
            $course = Course::where('slug', $item['slug'])->first();

            $cert = Certificate::firstOrCreate(
                ['code' => $item['code']],
                [
                    'name'             => $item['name'],
                    'issuer'           => $item['issuer'],
                    'required_pass_yn' => true,
                ]
            );

            if ($course && !$cert->courses()->where('course_id', $course->id)->exists()) {
                $cert->courses()->attach($course->id);
            }
        }
    }
}
