<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $base = rtrim((string) config('site.url', config('app.url')), '/');

        $paths = ['/', '/ar'];
        foreach (['mentions-legales', 'confidentialite'] as $slug) {
            $paths[] = '/'.$slug;
            $paths[] = '/ar/'.$slug;
        }

        $urls = '';
        foreach ($paths as $path) {
            $urls .= "  <url><loc>{$base}{$path}</loc><changefreq>monthly</changefreq></url>\n";
        }

        return response(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{$urls}</urlset>",
            200,
            ['Content-Type' => 'application/xml']
        );
    }
}
