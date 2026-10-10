<?php

// Libellés arabes (la locale `fr` utilise les frenchLabel() natifs des enums).
return [
    'App\Enums\LotType' => [
        'apartment' => 'شقة', 'studio' => 'ستوديو', 'duplex' => 'دوبلكس', 'shop' => 'محل تجاري',
        'office' => 'مكتب', 'house' => 'فيلا / منزل',
        'large_surface' => 'مساحة كبيرة', 'other' => 'أخرى',
    ],
    'App\Enums\UserType' => ['staff' => 'طاقم', 'owner' => 'مالك مشترك'],
    'App\Enums\StaffRole' => ['super_admin' => 'مدير عام', 'syndic' => 'سنديك', 'assistant' => 'مساعد'],
    'App\Enums\AccountStatus' => [
        'pending_activation' => 'في انتظار التفعيل', 'active' => 'نشط',
        'suspended' => 'موقوف', 'closed' => 'مغلق',
    ],
    'App\Enums\AccountEventType' => [
        'created' => 'أُنشئ', 'activation_link_issued' => 'أُرسل رابط التفعيل',
        'password_set' => 'تم تعيين كلمة المرور', 'password_changed' => 'تم تغيير كلمة المرور',
        'reset' => 'أُعيد تعيينه', 'handed_over' => 'تم تسليمه',
        'suspended' => 'موقوف', 'reactivated' => 'أُعيد تفعيله', 'closed' => 'مغلق',
        'login_success' => 'تسجيل دخول ناجح', 'login_failed' => 'تسجيل دخول فاشل',
        'sessions_revoked' => 'أُلغيت الجلسات',
    ],
    'App\Enums\ActorType' => ['staff' => 'طاقم', 'owner' => 'مالك مشترك', 'system' => 'النظام'],
    'App\Enums\OwnerType' => ['individual' => 'فرد', 'company' => 'شركة'],
    'App\Enums\OwnershipChangeReason' => [
        'initial' => 'ابتدائي', 'promoter_sale' => 'بيع أول (المنعش)',
        'sale' => 'بيع', 'inheritance' => 'إرث', 'donation' => 'هبة', 'other' => 'أخرى',
    ],
    'App\Enums\AccountRequestStatus' => [
        'submitted' => 'مُقدَّم', 'needs_info' => 'يلزم توضيح',
        'approved' => 'مقبول', 'rejected' => 'مرفوض',
    ],
    'App\Enums\AccountMatchResult' => [
        'exact' => 'يطابق المالك', 'owned_by_promoter' => 'ملك للمنعش (بيع أول)',
        'no_owner_on_record' => 'لا مالك مسجل', 'different_owner' => 'مالك آخر (إعادة بيع)',
        'lot_not_found' => 'الملك غير موجود',
    ],
    'App\Enums\QuitusPurpose' => ['sale' => 'بيع', 'fiscal_year' => 'سنة مالية', 'other' => 'أخرى'],
    'App\Enums\QuitusStatus' => ['valid' => 'صالح', 'used' => 'مستعمل', 'expired' => 'منتهي', 'cancelled' => 'ملغى'],
    'App\Enums\SaleStatus' => ['unsold' => 'غير مباع', 'sold' => 'مباع'],
    'App\Enums\ContributionType' => ['syndic' => 'سنديك', 'exceptional' => 'استثنائية'],
    'App\Enums\CalculationMode' => ['fixed' => 'جزافي', 'per_surface' => 'حسب المساحة', 'tantieme' => 'حصص'],
    'App\Enums\ContributionStatus' => ['draft' => 'مسودة', 'published' => 'منشورة', 'cancelled' => 'ملغاة'],
    'App\Enums\DueStatus' => ['unpaid' => 'غير مؤدى', 'partial' => 'جزئي', 'paid' => 'مؤدى', 'cancelled' => 'ملغى'],
    'App\Enums\PaymentMethod' => [
        'cheque' => 'شيك', 'transfer' => 'تحويل', 'deposit' => 'إيداع',
        'cash' => 'نقد', 'effet' => 'كمبيالة',
    ],
    'App\Enums\PaymentStatus' => [
        'pending' => 'في الانتظار', 'validated' => 'مصادق عليه',
        'rejected' => 'مرفوض', 'cancelled' => 'ملغى',
    ],
    'App\Enums\PaymentSource' => [
        'back_office' => 'الإدارة', 'owner_portal' => 'بوابة الملاك',
        'whatsapp' => 'واتساب', 'import' => 'استيراد',
    ],
    'App\Enums\AllocationMode' => ['auto' => 'تلقائي', 'manual' => 'يدوي'],
    'App\Enums\FiscalYearStatus' => ['open' => 'مفتوحة', 'closed' => 'مغلقة'],
    'App\Enums\ParkingStatus' => ['yes' => 'نعم', 'no' => 'لا', 'common' => 'مشترك'],
    'App\Enums\AnnexType' => ['parking' => 'موقف', 'box' => 'مرآب'],
    'App\Enums\BudgetType' => ['forecast' => 'تقديري', 'off_budget' => 'خارج الميزانية'],
    'App\Enums\BudgetKind' => ['operating' => 'تسيير', 'investment' => 'استثمار'],
    'App\Enums\BudgetStatus' => ['draft' => 'مسودة', 'approved' => 'مصادق عليه', 'closed' => 'مغلق'],
    'App\Enums\ExpenseKind' => ['expense' => 'مصروف', 'intervention' => 'تدخل'],
    'App\Enums\ExpenseStatus' => ['recorded' => 'مسجل', 'paid' => 'مدفوع', 'cancelled' => 'ملغى'],
    'App\Enums\TreasuryStatus' => ['draft' => 'مسودة', 'validated' => 'مصادق عليه'],
    'App\Enums\CollectionActionType' => [
        'reminder' => 'تذكير', 'formal_notice' => 'إنذار', 'lawyer_referral' => 'إحالة للمحامي',
    ],
    'App\Enums\NotificationChannel' => [
        'whatsapp' => 'واتساب', 'email' => 'بريد', 'letter' => 'رسالة', 'sms' => 'رسالة قصيرة',
    ],
    'App\Enums\DeliveryStatus' => [
        'queued' => 'في الانتظار', 'sent' => 'مُرسل', 'delivered' => 'مُستلم', 'failed' => 'فشل',
    ],
    'App\Enums\LawyerCaseStatus' => [
        'to_transmit' => 'للإرسال', 'transmitted' => 'مُرسل',
        'in_progress' => 'جارٍ', 'closed' => 'مغلق',
    ],
    'App\Enums\ComplaintStatus' => ['new' => 'جديد', 'in_progress' => 'جارٍ', 'resolved' => 'محلول'],
    'App\Enums\ComplaintSource' => ['staff' => 'طاقم', 'owner_portal' => 'بوابة الملاك', 'whatsapp' => 'واتساب'],
    'App\Enums\ComplaintPriority' => ['low' => 'منخفضة', 'normal' => 'عادية', 'urgent' => 'مستعجلة'],
    'App\Enums\AuthorType' => ['staff' => 'طاقم', 'owner' => 'مالك مشترك', 'bot' => 'روبوت'],
    'App\Enums\AssemblyType' => ['ordinary' => 'عادي', 'extraordinary' => 'استثنائي'],
    'App\Enums\AssemblyStatus' => [
        'draft' => 'مسودة', 'convened' => 'مُستدعاة', 'held' => 'منعقدة', 'closed' => 'مغلقة',
    ],
    'App\Enums\AttendanceType' => ['present' => 'حاضر', 'represented' => 'ممثَّل', 'absent' => 'غائب'],
    'App\Enums\MajorityRule' => ['simple' => 'أغلبية بسيطة', 'two_thirds' => 'ثلثان', 'unanimity' => 'إجماع'],
    'App\Enums\ResolutionResult' => ['pending' => 'في الانتظار', 'adopted' => 'مقبول', 'rejected' => 'مرفوض'],
    'App\Enums\VoteChoice' => ['for' => 'مع', 'against' => 'ضد', 'abstain' => 'ممتنع'],
    'App\Enums\DocumentType' => [
        'receipt' => 'وصل أداء', 'fund_call' => 'طلب مساهمة',
        'owner_statement' => 'كشف المالك', 'unpaid_statement' => 'كشف المتأخرات',
        'residence_statement' => 'كشف الإقامة', 'reminder' => 'تذكير',
        'formal_notice' => 'إنذار', 'lawyer_list' => 'لائحة المحامي',
        'assembly_notice' => 'استدعاء الجمع', 'attendance_list' => 'ورقة الحضور',
        'assembly_minutes' => 'محضر الجمع', 'quitus' => 'إبراء الذمة',
        'financial_report' => 'تقرير مالي', 'moral_report' => 'تقرير أدبي',
        'budget_forecast' => 'ميزانية تقديرية', 'expense_statement' => 'كشف المصاريف',
        'budget_vs_actual' => 'ميزانية مقابل المنجز', 'treasury_statement' => 'كشف الخزينة',
        'note' => 'مذكرة', 'information' => 'إعلان',
        'sale_contract' => 'عقد بيع', 'regulation' => 'نظام', 'other' => 'أخرى',
    ],
    'App\Enums\DocumentSource' => ['generated' => 'مولَّد', 'uploaded' => 'مرفوع'],
    'App\Enums\DocumentStatus' => [
        'draft' => 'مسودة', 'final' => 'نهائي', 'superseded' => 'مستبدَل', 'cancelled' => 'ملغى',
    ],
    'App\Enums\AnnouncementKind' => ['note' => 'مذكرة', 'information' => 'إعلان'],
    'App\Enums\DocumentVisibility' => ['staff' => 'طاقم', 'owner' => 'مالك مشترك', 'residence' => 'إقامة'],
    'App\Enums\ArrearsOnSale' => [
        'seller_pays' => 'البائع يدفع', 'buyer_pays' => 'المشتري يدفع', 'manual' => 'يدوي',
    ],
    'App\Enums\ApprovalAction' => [
        'delete' => 'حذف', 'send_reminders' => 'إرسال تذكيرات',
        'update_record' => 'تعديل', 'other' => 'أخرى',
    ],
    'App\Enums\ApprovalStatus' => [
        'pending' => 'في الانتظار', 'approved' => 'مقبولة',
        'rejected' => 'مرفوضة', 'expired' => 'منتهية',
    ],
    'App\Enums\ApiChannel' => ['mcp' => 'MCP', 'api' => 'API', 'whatsapp_agent' => 'وكيل واتساب'],
    'App\Enums\ConversationStatus' => ['bot' => 'روبوت', 'handed_off' => 'محوَّلة', 'closed' => 'مغلقة'],
    'App\Enums\MessageDirection' => ['in' => 'وارد', 'out' => 'صادر'],
    'App\Enums\InquiryType' => ['contact' => 'اتصال', 'quote' => 'عرض ثمن', 'demo' => 'عرض تجريبي'],
    'App\Enums\InquiryStatus' => ['new' => 'جديد', 'contacted' => 'تم الاتصال', 'closed' => 'مغلق'],
    'App\Enums\SequenceType' => [
        'receipt' => 'وصل', 'fund_call' => 'طلب مساهمة', 'notice' => 'استدعاء',
        'request' => 'طلب', 'formal_notice' => 'إنذار', 'quitus' => 'إبراء ذمة', 'minutes' => 'محضر',
    ],
    // Enums historiques (compatibilité écrans actuels).
    'App\Enums\UserRole' => ['syndic' => 'سنديك', 'coproprietaire' => 'مالك مشترك'],
    'App\Enums\ReclamationStatut' => [
        'nouveau' => 'جديد', 'en_cours' => 'جارٍ', 'traite' => 'معالَج', 'rejete' => 'مرفوض',
    ],
    'App\Enums\ModeRepartition' => [
        'egale' => 'بالتساوي', 'par_appartement' => 'حسب المحل', 'par_tantieme' => 'حسب الحصص',
    ],
    'App\Enums\ModePaiement' => [
        'especes' => 'نقد', 'virement' => 'تحويل', 'cheque' => 'شيك', 'carte' => 'بطاقة',
    ],
    'App\Enums\CotisationType' => ['fixe' => 'ثابتة', 'exceptionnelle' => 'استثنائية'],
    'App\Enums\CotisationDetailStatut' => [
        'non_paye' => 'غير مؤدى', 'partiellement_paye' => 'مؤدى جزئيا', 'paye' => 'مؤدى',
    ],
];
