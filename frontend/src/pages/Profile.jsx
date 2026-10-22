
import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [nameError, setNameError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState({});

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
            setFullName(response.data.fullName || '');
        } catch (err) {
            setProfileError(
                err.response?.data?.message ||
                'Unable to load your profile. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    function validateFullName(value) {
        const name = value.trim();

        if (!name) return 'Full name is required.';
        if (name.length < 2) return 'Full name must contain at least 2 characters.';
        if (name.length > 100) return 'Full name cannot exceed 100 characters.';

        if (!/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(name)) {
            return 'Use letters, spaces, hyphens or apostrophes only.';
        }

        return '';
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        setProfileMessage('');
        setProfileError('');

        const validationError = validateFullName(fullName);
        setNameError(validationError);

        if (validationError || saving) return;

        const name = fullName.trim();

        if (name === (profile.fullName || '')) {
            setProfileMessage('Your profile is already up to date.');
            return;
        }

        setSaving(true);

        try {
            const response = await api.put('/users/me', {
                fullName: name
            });

            setProfile(response.data);
            setFullName(response.data.fullName || name);
            setProfileMessage('Profile updated successfully.');
        } catch (err) {
            setProfileError(
                err.response?.data?.message ||
                'Unable to update your profile. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    }

    function validatePasswords() {
        const errors = {};

        if (!currentPassword) {
            errors.currentPassword = 'Current password is required.';
        }

        if (!newPassword) {
            errors.newPassword = 'New password is required.';
        } else if (newPassword.length < 12 || newPassword.length > 72) {
            errors.newPassword = 'Password must be 12–72 characters long.';
        } else if (newPassword.trim() === '') {
            errors.newPassword = 'Password cannot contain only spaces.';
        } else if (
            !/[a-z]/.test(newPassword) ||
            !/[A-Z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            errors.newPassword =
                'Include uppercase, lowercase, a number and a special character.';
        } else if (
            currentPassword &&
            newPassword === currentPassword
        ) {
            errors.newPassword =
                'Your new password must differ from your current password.';
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password.';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        return errors;
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        const errors = validatePasswords();
        setPasswordErrors(errors);

        if (Object.keys(errors).length || changingPassword) return;

        setChangingPassword(true);

        try {
            await api.put('/users/me/password', {
                currentPassword,
                newPassword
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordErrors({});
            setShowPasswords({
                current: false,
                new: false,
                confirm: false
            });

            setPasswordMessage('Password changed successfully.');
        } catch (err) {
            setPasswordError(
                err.response?.data?.message ||
                'Unable to change password. Check your current password and try again.'
            );
        } finally {
            setChangingPassword(false);
        }
    }

    function togglePassword(field) {
        setShowPasswords(previous => ({
            ...previous,
            [field]: !previous[field]
        }));
    }

    function fieldStyle(hasError = false) {
        return {
            ...styles.input,
            ...(hasError ? styles.invalidInput : {})
        };
    }

    function passwordField(id, label, value, setter, field, autoComplete) {
        return (
            <div style={styles.field} key={id}>
                <label htmlFor={id} style={styles.label}>{label}</label>

                <div style={styles.passwordWrapper}>
                    <input
                        id={id}
                        type={showPasswords[field] ? 'text' : 'password'}
                        value={value}
                        onChange={e => {
                            setter(e.target.value);
                            setPasswordErrors(previous => ({
                                ...previous,
                                [id]: ''
                            }));
                            setPasswordError('');
                            setPasswordMessage('');
                        }}
                        autoComplete={autoComplete}
                        maxLength={72}
                        minLength={id === 'currentPassword' ? undefined : 12}
                        aria-invalid={Boolean(passwordErrors[id])}
                        aria-describedby={passwordErrors[id] ? `${id}-error` : undefined}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={fieldStyle(Boolean(passwordErrors[id]))}
                        required
                    />

                    <button
                        type="button"
                        onClick={() => togglePassword(field)}
                        style={styles.showButton}
                        aria-label={`${showPasswords[field] ? 'Hide' : 'Show'} ${label}`}
                    >
                        {showPasswords[field] ? 'Hide' : 'Show'}
                    </button>
                </div>

                {passwordErrors[id] && (
                    <small id={`${id}-error`} style={styles.errorText}>
                        {passwordErrors[id]}
                    </small>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loading}>Loading your profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={styles.page}>
                <div role="alert" style={styles.errorAlert}>
                    {profileError || 'Unable to load your profile.'}
                </div>
                <button
                    style={styles.primaryButton}
                    onClick={() => {
                        setLoading(true);
                        setProfileError('');
                        loadProfile();
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div style={styles.avatar}>
                    {(profile.fullName || profile.email || 'U')
                        .trim().charAt(0).toUpperCase()}
                </div>

                <div>
                    <h1 style={styles.title}>My Profile</h1>
                    <p style={styles.subtitle}>
                        Manage your personal information and account security.
                    </p>
                </div>
            </header>

            <section style={styles.card}>
                <div style={styles.cardHeading}>
                    <div>
                        <h2 style={styles.cardTitle}>Personal Information</h2>
                        <p style={styles.cardDescription}>
                            Update the name associated with your account.
                        </p>
                    </div>
                    <span style={styles.icon}>✎</span>
                </div>

                {profileMessage && (
                    <div role="status" style={styles.successAlert}>
                        ✓ {profileMessage}
                    </div>
                )}

                {profileError && (
                    <div role="alert" style={styles.errorAlert}>
                        {profileError}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} noValidate>
                    <div style={styles.field}>
                        <label htmlFor="fullName" style={styles.label}>
                            Full name
                        </label>
                        <input
                            id="fullName"
                            value={fullName}
                            onChange={e => {
                                setFullName(e.target.value);
                                setNameError('');
                                setProfileError('');
                                setProfileMessage('');
                            }}
                            onBlur={() => setNameError(validateFullName(fullName))}
                            maxLength={100}
                            autoComplete="name"
                            placeholder="Enter your full name"
                            aria-invalid={Boolean(nameError)}
                            aria-describedby={nameError ? 'name-error' : 'name-hint'}
                            style={fieldStyle(Boolean(nameError))}
                        />

                        {nameError ? (
                            <small id="name-error" style={styles.errorText}>
                                {nameError}
                            </small>
                        ) : (
                            <small id="name-hint" style={styles.hint}>
                                Use 2–100 characters.
                            </small>
                        )}
                    </div>

                    <div style={styles.field}>
                        <label htmlFor="email" style={styles.label}>
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={profile.email || ''}
                            readOnly
                            style={{ ...styles.input, ...styles.readOnly }}
                        />
                        <small style={styles.hint}>
                            Your registered email cannot be changed here.
                        </small>
                    </div>

                    <div style={{ ...styles.grid }} className="profile-responsive-grid">
                        <div style={styles.field}>
                            <label htmlFor="role" style={styles.label}>Role</label>
                            <input
                                id="role"
                                value={profile.role || ''}
                                readOnly
                                style={{ ...styles.input, ...styles.readOnly }}
                            />
                        </div>

                        <div style={styles.field}>
                            <label htmlFor="accountStatus" style={styles.label}>
                                Account status
                            </label>
                            <input
                                id="accountStatus"
                                value={profile.enabled ? 'Active' : 'Disabled'}
                                readOnly
                                style={{ ...styles.input, ...styles.readOnly }}
                            />
                        </div>
                    </div>

                    <div style={styles.actions}>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                ...styles.primaryButton,
                                ...(saving ? styles.disabledButton : {})
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </section>

            <section style={styles.card}>
                <div style={styles.cardHeading}>
                    <div>
                        <h2 style={styles.cardTitle}>Change Password</h2>
                        <p style={styles.cardDescription}>
                            Keep your account secure with a strong password.
                        </p>
                    </div>
                    <span style={styles.icon}>♧</span>
                </div>

                {passwordMessage && (
                    <div role="status" style={styles.successAlert}>
                        ✓ {passwordMessage}
                    </div>
                )}

                {passwordError && (
                    <div role="alert" style={styles.errorAlert}>
                        {passwordError}
                    </div>
                )}

                <form onSubmit={handleChangePassword} noValidate>
                    {passwordField(
                        'currentPassword',
                        'Current password',
                        currentPassword,
                        setCurrentPassword,
                        'current',
                        'current-password'
                    )}

                    {passwordField(
                        'newPassword',
                        'New password',
                        newPassword,
                        setNewPassword,
                        'new',
                        'new-password'
                    )}

                    {passwordField(
                        'confirmPassword',
                        'Confirm new password',
                        confirmPassword,
                        setConfirmPassword,
                        'confirm',
                        'new-password'
                    )}

                    <div style={styles.passwordHint}>
                        Use 12–72 characters with uppercase and lowercase letters,
                        a number and a special character.
                    </div>

                    <div style={styles.actions}>
                        <button
                            type="submit"
                            disabled={changingPassword}
                            style={{
                                ...styles.primaryButton,
                                ...(changingPassword ? styles.disabledButton : {})
                            }}
                        >
                            {changingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </section>

            <style>{`
                .profile-action-button:hover:not(:disabled) {
                    filter: brightness(0.94);
                }

                @media (max-width: 600px) {
                    .profile-responsive-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

const styles = {
    page: {
        width: '100%',
        maxWidth: 900,
        margin: '0 auto',
        padding: '28px 24px 40px',
        boxSizing: 'border-box',
        color: 'var(--text-primary, #1f2937)'
    },
    loading: {
        padding: 50,
        textAlign: 'center',
        color: '#64748b'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28
    },
    avatar: {
        width: 58,
        height: 58,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        background: 'var(--primary-color, #315efb)',
        color: '#fff',
        fontSize: 25,
        fontWeight: 700
    },
    title: {
        margin: '0 0 6px',
        fontSize: 27,
        fontWeight: 700
    },
    subtitle: {
        margin: 0,
        color: 'var(--text-secondary, #6b7280)',
        fontSize: 14,
        lineHeight: 1.6
    },
    card: {
        marginBottom: 24,
        padding: 26,
        border: '1px solid var(--border-color, #e5e7eb)',
        borderRadius: 14,
        background: 'var(--card-bg, #fff)',
        boxShadow: '0 3px 12px rgb(15 23 42 / 4%)'
    },
    cardHeading: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 24
    },
    cardTitle: {
        margin: '0 0 7px',
        fontSize: 19,
        fontWeight: 650
    },
    cardDescription: {
        margin: 0,
        color: 'var(--text-secondary, #6b7280)',
        fontSize: 14,
        lineHeight: 1.6
    },
    icon: {
        width: 40,
        height: 40,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        background: '#f3f6fb',
        color: 'var(--primary-color, #315efb)',
        fontSize: 21
    },
    field: {
        minWidth: 0,
        marginBottom: 20
    },
    label: {
        display: 'block',
        marginBottom: 8,
        fontSize: 13,
        fontWeight: 600
    },
    input: {
        display: 'block',
        width: '100%',
        minHeight: 44,
        padding: '11px 13px',
        boxSizing: 'border-box',
        border: '1px solid var(--border-color, #d1d5db)',
        borderRadius: 8,
        outline: 'none',
        background: 'var(--input-bg, #fff)',
        color: 'var(--text-primary, #1f2937)',
        fontFamily: 'inherit',
        fontSize: 14
    },
    invalidInput: {
        border: '1px solid #dc2626',
        background: '#fffafa'
    },
    readOnly: {
        background: 'var(--surface-secondary, #f8fafc)',
        color: 'var(--text-secondary, #64748b)',
        cursor: 'not-allowed'
    },
    hint: {
        display: 'block',
        marginTop: 7,
        color: 'var(--text-secondary, #6b7280)',
        fontSize: 12,
        lineHeight: 1.5
    },
    errorText: {
        display: 'block',
        marginTop: 7,
        color: '#dc2626',
        fontSize: 12,
        lineHeight: 1.5
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 18
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 8
    },
    primaryButton: {
        minHeight: 42,
        padding: '10px 18px',
        border: 0,
        borderRadius: 8,
        background: 'var(--primary-color, #315efb)',
        color: '#fff',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer'
    },
    disabledButton: {
        opacity: 0.65,
        cursor: 'not-allowed'
    },
    successAlert: {
        marginBottom: 20,
        padding: '12px 14px',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        background: '#f0fdf4',
        color: '#166534',
        fontSize: 13,
        lineHeight: 1.5
    },
    errorAlert: {
        marginBottom: 20,
        padding: '12px 14px',
        border: '1px solid #fecaca',
        borderRadius: 8,
        background: '#fef2f2',
        color: '#991b1b',
        fontSize: 13,
        lineHeight: 1.5
    },
    passwordWrapper: {
        position: 'relative'
    },
    showButton: {
        position: 'absolute',
        top: '50%',
        right: 12,
        transform: 'translateY(-50%)',
        padding: 5,
        border: 0,
        background: 'transparent',
        color: 'var(--primary-color, #315efb)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer'
    },
    passwordHint: {
        marginBottom: 20,
        padding: '12px 14px',
        borderRadius: 8,
        background: 'var(--surface-secondary, #f8fafc)',
        color: 'var(--text-secondary, #64748b)',
        fontSize: 12,
        lineHeight: 1.6
    }
};
