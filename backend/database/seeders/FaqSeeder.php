<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            // 수강 관련
            ['category' => '수강', 'order_no' => 1, 'question' => '수강신청은 어떻게 하나요?', 'answer' => '학기 수강신청 기간에 [학사일정] 메뉴에서 원하시는 강좌의 분반을 선택하여 신청하시면 됩니다. 자격증 과정은 상시 신청 가능합니다.'],
            ['category' => '수강', 'order_no' => 2, 'question' => '수강 취소는 가능한가요?', 'answer' => '수강신청 취소는 수강취소 기간 내에 [내 강의실] → 해당 강좌 → 수강 취소 버튼을 통해 가능합니다. 취소 기간 이후에는 관리자에게 문의해 주세요.'],
            ['category' => '수강', 'order_no' => 3, 'question' => '강의 진도율이 어떻게 계산되나요?', 'answer' => '각 차시 동영상 시청 시 진도율이 자동으로 기록됩니다. 차시별 95% 이상 시청 시 완료로 처리되며, 전체 차시의 80% 이상 완료 시 수료 처리됩니다.'],
            ['category' => '수강', 'order_no' => 4, 'question' => '모바일에서도 수강할 수 있나요?', 'answer' => 'zslab LMS는 모바일 브라우저를 지원합니다. 앱 없이 모바일 웹에서 동영상 시청 및 과제 제출이 가능합니다.'],
            // 시험·과제
            ['category' => '시험·과제', 'order_no' => 1, 'question' => '시험 도중 창을 닫으면 어떻게 되나요?', 'answer' => '시험 시작 후 창을 닫아도 답안이 자동 저장됩니다. 재접속 시 이어서 응시하실 수 있으나, 제한 시간이 있는 경우 시간은 계속 진행됩니다.'],
            ['category' => '시험·과제', 'order_no' => 2, 'question' => '과제 제출 후 수정이 가능한가요?', 'answer' => '과제 제출 후에는 수정이 불가합니다. 제출 전 내용을 충분히 검토하신 후 제출해 주세요.'],
            ['category' => '시험·과제', 'order_no' => 3, 'question' => '성적은 언제 확인할 수 있나요?', 'answer' => '객관식 시험은 제출 즉시 자동 채점됩니다. 서술형 시험과 과제는 교수·튜터 채점 후 결과가 안내됩니다. 채점 소요 기간은 강좌마다 다릅니다.'],
            ['category' => '시험·과제', 'order_no' => 4, 'question' => '재응시가 가능한가요?', 'answer' => '원칙적으로 시험 재응시는 불가합니다. 기술적 문제로 인한 응시 오류의 경우 1:1 문의를 통해 관리자에게 문의해 주세요.'],
            // 자격증
            ['category' => '자격증', 'order_no' => 1, 'question' => '자격증은 어떻게 발급받나요?', 'answer' => '해당 과정 수료 및 시험 합격 후 [내 자격증] 메뉴에서 발급 신청 및 PDF 다운로드가 가능합니다.'],
            ['category' => '자격증', 'order_no' => 2, 'question' => '자격증 진위확인은 어떻게 하나요?', 'answer' => '자격증 하단의 QR코드 또는 [진위확인] 메뉴에서 일련번호를 입력하시면 진위를 확인하실 수 있습니다.'],
            ['category' => '자격증', 'order_no' => 3, 'question' => '자격증 PDF를 분실했어요.', 'answer' => '[내 자격증] 메뉴에서 언제든지 재다운로드하실 수 있습니다. 발급된 자격증은 계정에 영구 보관됩니다.'],
            ['category' => '자격증', 'order_no' => 4, 'question' => '학점은행제 학점은 어떻게 신청하나요?', 'answer' => '학점은행제 과정 수료 후 [내 자격증] 또는 [학점인정 신청] 메뉴를 통해 신청하실 수 있습니다. 매 학기 신청 기간을 확인해 주세요.'],
        ];

        foreach ($faqs as $f) {
            Faq::firstOrCreate(['question' => $f['question']], array_merge($f, ['is_published' => true]));
        }
    }
}
