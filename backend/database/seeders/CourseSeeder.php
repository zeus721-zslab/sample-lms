<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $professor = User::whereHas('roles', fn ($q) => $q->where('code', 'professor'))->first();
        $instructorId = $professor?->id;

        $courses = [
            /* ── 학점은행 · IT ── */
            'cb_it' => [
                ['title' => '파이썬 프로그래밍 기초',          'slug' => 'python-basics',        'desc' => 'Python 언어의 기초 문법부터 실전 응용까지 체계적으로 학습합니다.',         'price' => 150000, 'credit' => 3, 'lessons' => 24, 'mode' => 'ondemand'],
                ['title' => '데이터베이스 설계와 SQL',          'slug' => 'db-sql',               'desc' => '관계형 DB 설계 원리와 SQL 쿼리 최적화를 실습 중심으로 익힙니다.',          'price' => 130000, 'credit' => 3, 'lessons' => 20, 'mode' => 'ondemand'],
                ['title' => '웹 프론트엔드 개발 (React)',        'slug' => 'react-frontend',       'desc' => 'React 18 기반 SPA 개발의 핵심 패턴과 상태 관리를 학습합니다.',             'price' => 180000, 'credit' => 3, 'lessons' => 28, 'mode' => 'ondemand'],
                ['title' => '클라우드 컴퓨팅 개론',             'slug' => 'cloud-intro',          'desc' => 'AWS·Azure·GCP 주요 서비스를 비교하며 클라우드 아키텍처를 이해합니다.',      'price' => 120000, 'credit' => 2, 'lessons' => 16, 'mode' => 'semester'],
            ],
            /* ── 학점은행 · 경영 ── */
            'cb_biz' => [
                ['title' => '경영학 원론',                     'slug' => 'management-intro',     'desc' => '현대 기업 경영의 핵심 이론과 사례를 통해 경영 전반을 조망합니다.',          'price' => 100000, 'credit' => 3, 'lessons' => 18, 'mode' => 'ondemand'],
                ['title' => '재무회계 기초',                   'slug' => 'financial-accounting',  'desc' => '재무제표 작성 원리와 회계 기준을 학습하여 재무 분석 역량을 키웁니다.',       'price' => 110000, 'credit' => 3, 'lessons' => 20, 'mode' => 'ondemand'],
                ['title' => '마케팅 전략과 디지털 광고',         'slug' => 'marketing-strategy',   'desc' => '디지털 채널 기반 마케팅 전략 수립 및 성과 분석 방법을 다룹니다.',           'price' => 120000, 'credit' => 3, 'lessons' => 22, 'mode' => 'ondemand'],
                ['title' => '인사조직론',                      'slug' => 'hr-management',        'desc' => '조직 행동 이론과 인적자원 관리 실무를 체계적으로 학습합니다.',               'price' => 100000, 'credit' => 2, 'lessons' => 16, 'mode' => 'semester'],
            ],
            /* ── 학점은행 · 사회복지 ── */
            'cb_social' => [
                ['title' => '사회복지개론',                    'slug' => 'social-welfare-intro', 'desc' => '사회복지의 역사와 이론적 기반을 학습하고 실천 방향을 탐색합니다.',           'price' => 90000,  'credit' => 3, 'lessons' => 18, 'mode' => 'ondemand'],
                ['title' => '노인복지론',                      'slug' => 'elderly-welfare',      'desc' => '고령화 사회의 노인 복지 정책과 현장 실천 역량을 키웁니다.',                 'price' => 90000,  'credit' => 3, 'lessons' => 18, 'mode' => 'ondemand'],
                ['title' => '아동·청소년 복지론',               'slug' => 'child-youth-welfare',  'desc' => '아동·청소년 복지 관련 법령과 현장 사례 중심으로 학습합니다.',               'price' => 90000,  'credit' => 3, 'lessons' => 18, 'mode' => 'semester'],
            ],
            /* ── 자격증 · IT ── */
            'cert_it' => [
                ['title' => '정보처리기사 합격 완성',            'slug' => 'ipq-pass',             'desc' => '최신 출제 경향을 반영한 이론+실기 통합 강의로 한 번에 합격을 노립니다.',     'price' => 85000,  'credit' => null, 'lessons' => 30, 'mode' => 'ondemand'],
                ['title' => 'SQLD 단기 합격 전략',              'slug' => 'sqld-pass',            'desc' => 'SQL 개발자 자격증 대비 핵심 이론과 기출 문제 풀이를 집중 학습합니다.',       'price' => 65000,  'credit' => null, 'lessons' => 20, 'mode' => 'ondemand'],
                ['title' => 'AWS Solutions Architect 준비',   'slug' => 'aws-sa-prep',          'desc' => 'AWS SAA-C03 시험 대비 서비스 이해와 아키텍처 설계 역량을 기릅니다.',         'price' => 95000,  'credit' => null, 'lessons' => 25, 'mode' => 'ondemand'],
                ['title' => '네트워크 관리사 2급 완성',          'slug' => 'network-admin-2',      'desc' => '네트워크 기초부터 실기 구성까지 체계적으로 준비합니다.',                     'price' => 70000,  'credit' => null, 'lessons' => 22, 'mode' => 'ondemand'],
            ],
            /* ── 자격증 · 금융 ── */
            'cert_fin' => [
                ['title' => '재경관리사 단기 완성',              'slug' => 'cpa-junior-pass',      'desc' => '재무회계·원가관리·세무회계 3과목 통합 정리로 단기 합격을 목표합니다.',        'price' => 75000,  'credit' => null, 'lessons' => 24, 'mode' => 'ondemand'],
                ['title' => '펀드투자권유대행인 시험 대비',       'slug' => 'fund-agent-prep',      'desc' => '펀드 이론과 관련 법규를 체계적으로 정리하여 시험을 준비합니다.',              'price' => 55000,  'credit' => null, 'lessons' => 16, 'mode' => 'ondemand'],
                ['title' => 'ERP 정보관리사 (회계)',             'slug' => 'erp-accounting',       'desc' => 'ERP 회계 모듈 실습과 이론을 병행하며 자격증을 취득합니다.',                 'price' => 60000,  'credit' => null, 'lessons' => 18, 'mode' => 'ondemand'],
            ],
            /* ── 자격증 · 어학 ── */
            'cert_lang' => [
                ['title' => 'TOEIC 900+ 목표 완성',            'slug' => 'toeic-900',            'desc' => '파트별 전략과 실전 모의고사로 TOEIC 고득점을 달성합니다.',                  'price' => 80000,  'credit' => null, 'lessons' => 28, 'mode' => 'ondemand'],
                ['title' => 'OPIc IM 이상 완성',               'slug' => 'opic-im',              'desc' => '스피킹 전략과 롤플레이 연습으로 OPIc IM 등급을 확보합니다.',                'price' => 75000,  'credit' => null, 'lessons' => 20, 'mode' => 'ondemand'],
                ['title' => 'JLPT N2 합격 전략',               'slug' => 'jlpt-n2',              'desc' => '어휘·문법·독해·청해 전 영역을 균형 있게 학습하여 N2를 목표합니다.',          'price' => 70000,  'credit' => null, 'lessons' => 24, 'mode' => 'ondemand'],
            ],
        ];

        // 카테고리 코드 → course_type 매핑
        $typeMap = [
            'cb_it'     => 'credit_bank',
            'cb_biz'    => 'credit_bank',
            'cb_social' => 'credit_bank',
            'cert_it'   => 'certificate',
            'cert_fin'  => 'certificate',
            'cert_lang' => 'certificate',
        ];

        foreach ($courses as $catCode => $items) {
            $category = Category::where('code', $catCode)->first();
            if (!$category) continue;

            foreach ($items as $item) {
                Course::firstOrCreate(
                    ['slug' => $item['slug']],
                    [
                        'course_type'   => $typeMap[$catCode],
                        'category_id'   => $category->id,
                        'title'         => $item['title'],
                        'slug'          => $item['slug'],
                        'description'   => $item['desc'],
                        'credit_hours'  => $item['credit'],
                        'total_lessons' => $item['lessons'],
                        'price'         => $item['price'],
                        'instructor_id' => $instructorId,
                        'status'        => 'published',
                        'mode'          => $item['mode'],
                    ]
                );
            }
        }
    }
}
