# 📧 Szablony Email dla eTrener

Profesjonalne, polskie szablony email dla autentykacji Supabase.

## 📋 Spis Treści

- [Jak Wdrożyć](#jak-wdrożyć)
- [Szablony](#szablony)
  - [1. Confirm Signup](#1-confirm-signup)
  - [2. Reset Password](#2-reset-password)
  - [3. Magic Link](#3-magic-link)
  - [4. Change Email](#4-change-email)
- [Charakterystyka](#charakterystyka)

---

## 🔧 Jak Wdrożyć

1. **Zaloguj się do Supabase Dashboard**
2. **Przejdź do**: `Authentication` → `Email Templates`
3. **Wybierz szablon** (np. "Confirm signup")
4. **Wklej odpowiedni kod HTML** z poniższych szablonów
5. **Zapisz zmiany**

**Ważne zmienne Supabase:**
- `{{ .ConfirmationURL }}` - link potwierdzający (automatycznie generowany)
- `{{ .Token }}` - token (jeśli potrzebny)
- `{{ .Email }}` - email użytkownika (jeśli potrzebny)

---

## 📧 Szablony

### 1. Confirm Signup

**Kolor:** Niebieski (#3b82f6)  
**Cel:** Potwierdzenie rejestracji nowego użytkownika

```html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdź rejestrację - eTrener</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                🎯 eTrener
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 14px; font-weight: 500; opacity: 0.9;">
                                Interaktywna Platforma Edukacyjna
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 16px 0; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                                Potwierdź swoją rejestrację
                            </h2>
                            
                            <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                Witaj! Dziękujemy za rejestrację w eTrener. Aby aktywować swoje konto, kliknij poniższy przycisk.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                                            Potwierdź konto
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background-color: #334155; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                                <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                    <strong style="color: #cbd5e1;">⏱️ Link jest ważny przez 60 minut.</strong><br>
                                    Jeśli nie zakładałeś konta, zignoruj tę wiadomość.
                                </p>
                            </div>
                            
                            <!-- Alternative Link -->
                            <div style="border-top: 1px solid #334155; padding-top: 20px;">
                                <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
                                    Jeśli przycisk nie działa, skopiuj poniższy link:
                                </p>
                                <p style="margin: 0; color: #60a5fa; font-size: 12px; word-break: break-all;">
                                    {{ .ConfirmationURL }}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 30px; text-align: center; border-top: 1px solid #334155;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © 2025 eTrener. Wszystkie prawa zastrzeżone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

### 2. Reset Password

**Kolor:** Pomarańczowy (#f59e0b)  
**Cel:** Resetowanie zapomnianego hasła

```html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resetowanie hasła - eTrener</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                🎯 eTrener
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 14px; font-weight: 500; opacity: 0.9;">
                                Interaktywna Platforma Edukacyjna
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 16px 0; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                                Zresetuj swoje hasło
                            </h2>
                            
                            <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Kliknij poniższy przycisk, aby ustawić nowe hasło.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                                            Zresetuj hasło
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background-color: #334155; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                                <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                    <strong style="color: #cbd5e1;">⏱️ Link jest ważny przez 60 minut.</strong><br>
                                    Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
                                </p>
                            </div>
                            
                            <!-- Alternative Link -->
                            <div style="border-top: 1px solid #334155; padding-top: 20px;">
                                <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
                                    Jeśli przycisk nie działa, skopiuj poniższy link:
                                </p>
                                <p style="margin: 0; color: #fbbf24; font-size: 12px; word-break: break-all;">
                                    {{ .ConfirmationURL }}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 30px; text-align: center; border-top: 1px solid #334155;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © 2025 eTrener. Wszystkie prawa zastrzeżone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

### 3. Magic Link

**Kolor:** Zielony (#10b981)  
**Cel:** Logowanie bez hasła (passwordless)

```html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaloguj się - eTrener</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                🎯 eTrener
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px; font-weight: 500; opacity: 0.9;">
                                Interaktywna Platforma Edukacyjna
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 16px 0; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                                Zaloguj się do swojego konta
                            </h2>
                            
                            <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                Kliknij poniższy przycisk, aby zalogować się do eTrener bez podawania hasła.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                                            Zaloguj się
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background-color: #334155; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                                <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                    <strong style="color: #cbd5e1;">⏱️ Link jest ważny przez 60 minut.</strong><br>
                                    Jeśli nie próbowałeś się zalogować, zignoruj tę wiadomość.
                                </p>
                            </div>
                            
                            <!-- Alternative Link -->
                            <div style="border-top: 1px solid #334155; padding-top: 20px;">
                                <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
                                    Jeśli przycisk nie działa, skopiuj poniższy link:
                                </p>
                                <p style="margin: 0; color: #34d399; font-size: 12px; word-break: break-all;">
                                    {{ .ConfirmationURL }}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 30px; text-align: center; border-top: 1px solid #334155;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © 2025 eTrener. Wszystkie prawa zastrzeżone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

### 4. Change Email

**Kolor:** Fioletowy (#8b5cf6)  
**Cel:** Potwierdzenie zmiany adresu email

```html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdź zmianę email - eTrener</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                🎯 eTrener
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ede9fe; font-size: 14px; font-weight: 500; opacity: 0.9;">
                                Interaktywna Platforma Edukacyjna
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 16px 0; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                                Potwierdź zmianę adresu email
                            </h2>
                            
                            <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                Otrzymaliśmy prośbę o zmianę adresu email powiązanego z Twoim kontem. Kliknij poniższy przycisk, aby potwierdzić zmianę.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
                                            Potwierdź zmianę
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background-color: #334155; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                                <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                    <strong style="color: #cbd5e1;">⏱️ Link jest ważny przez 60 minut.</strong><br>
                                    Jeśli nie prosiłeś o zmianę email, zignoruj tę wiadomość.
                                </p>
                            </div>
                            
                            <!-- Alternative Link -->
                            <div style="border-top: 1px solid #334155; padding-top: 20px;">
                                <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
                                    Jeśli przycisk nie działa, skopiuj poniższy link:
                                </p>
                                <p style="margin: 0; color: #a78bfa; font-size: 12px; word-break: break-all;">
                                    {{ .ConfirmationURL }}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 30px; text-align: center; border-top: 1px solid #334155;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © 2025 eTrener. Wszystkie prawa zastrzeżone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## ✨ Charakterystyka

### Design
- **🎨 Ciemny motyw** - zgodny z aplikacją eTrener
- **📱 Responsywne** - działają na wszystkich urządzeniach i klientach email
- **🎯 Minimalistyczne** - czytelne i profesjonalne

### Kolory Akcentów
| Szablon | Kolor | Hex | Zastosowanie |
|---------|-------|-----|--------------|
| Confirm Signup | 🔵 Niebieski | `#3b82f6` | Pozytywne powitanie |
| Reset Password | 🟠 Pomarańczowy | `#f59e0b` | Uwaga/ostrzeżenie |
| Magic Link | 🟢 Zielony | `#10b981` | Szybkie działanie |
| Change Email | 🟣 Fioletowy | `#8b5cf6` | Zmiana ustawień |

### Struktura (Jednolita)
1. **Header** - gradient z logo i nazwą aplikacji
2. **Tytuł** - jasny, czytelny nagłówek
3. **Treść** - krótki opis akcji
4. **Przycisk CTA** - wyraźny, z gradientem
5. **Info Box** - ważność linku i informacje
6. **Alternatywny link** - dla problemów z przyciskiem
7. **Footer** - copyright

### Bezpieczeństwo
- ⏱️ Informacja o ważności linku (60 minut)
- 🔒 Ostrzeżenia dla nieautoryzowanych akcji
- 📋 Alternatywny link tekstowy

### Kompatybilność
- ✅ Gmail, Outlook, Apple Mail
- ✅ Webmail i klienty desktopowe
- ✅ Mobile i tablet
- ✅ Używa tabel (najlepsza kompatybilność z klientami email)

---

## 📝 Notatki

- Wszystkie szablony używają inline CSS (wymagane dla emaili)
- Zmienne `{{ .ConfirmationURL }}` są automatycznie zastępowane przez Supabase
- Fonty: Inter z fallbackiem na systemowe
- Maksymalna szerokość: 600px (standard email)

---

**Ostatnia aktualizacja:** 2025-10-29  
**Wersja:** 1.0

