<?php

/*
 * The landing page prompt forbids a specific client company name everywhere:
 * it is inspiration only, with no relation to this product.
 * This test scans every file created for the public site and fails on match.
 */

it('contains no reference to the forbidden client name', function () {
    $roots = [
        base_path('app/Http/Controllers/Public'),
        base_path('app/Http/Requests/Public'),
        base_path('app/Services/InquiryService.php'),
        base_path('app/Notifications/NewInquiryNotification.php'),
        base_path('config/site.php'),
        base_path('lang'),
    ];

    $front = realpath(base_path('../syndicpro-front/src'));
    if ($front !== false) {
        $roots[] = $front.'/pages/public';
        $roots[] = $front.'/components/landing';
        $roots[] = $front.'/i18n';
    }

    $hits = [];
    foreach ($roots as $root) {
        if (! is_dir($root) && ! is_file($root)) {
            continue;
        }
        $files = is_file($root)
            ? [new SplFileInfo($root)]
            : new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
            );
        foreach ($files as $file) {
            if (! $file instanceof SplFileInfo || $file->isDir()) {
                continue;
            }
            if (! $file->isFile() || ! $file->isReadable()) {
                continue;
            }
            $content = @file_get_contents($file->getPathname());
            if ($content === false) {
                continue;
            }
            if (mb_stripos($content, 'KHALLOUFI') !== false) {
                $hits[] = (string) $file;
            }
        }
    }

    expect($hits)->toBeEmpty('Forbidden client name found in: '.implode(', ', $hits));
});
