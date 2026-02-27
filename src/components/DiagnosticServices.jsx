import React, { useState } from 'react';
import { ChevronRight, Monitor, Check } from 'lucide-react';

/* ─── FDI Tooth Numbers ─────────────────────────────────────── */
const ADULT = {
    upperLeft: [18, 17, 16, 15, 14, 13, 12, 11],
    upperRight: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerLeft: [48, 47, 46, 45, 44, 43, 42, 41],
    lowerRight: [31, 32, 33, 34, 35, 36, 37, 38],
};
const CHILD = {
    upperLeft: [55, 54, 53, 52, 51],
    upperRight: [61, 62, 63, 64, 65],
    lowerLeft: [85, 84, 83, 82, 81],
    lowerRight: [71, 72, 73, 74, 75],
};

/* ─── Service Definitions ───────────────────────────────────── */
const SERVICES = [
    { id: 'single-tooth', label: 'CBCT Single Tooth', needsTooth: true, maxTeeth: 1 },
    { id: 'segment', label: 'CBCT Segment (Max 4-5 teeth)', needsTooth: true, maxTeeth: 5 },
    { id: 'maxilla', label: 'CBCT Maxilla', needsTooth: false },
    { id: 'mandible', label: 'CBCT Mandible', needsTooth: false },
    { id: 'tmj', label: 'CBCT TMJ', needsTooth: false },
    { id: 'maxilla-mandible', label: 'CBCT Maxilla & Mandible', needsTooth: false },
    { id: 'full-skull', label: 'CBCT Full Skull View', needsTooth: false },
];

/* ─── Tooth Chart Component ─────────────────────────────────── */
function ToothChart({ isChild, selected, onSelect, maxTeeth }) {
    const teeth = isChild ? CHILD : ADULT;

    const toggle = (num) => {
        if (selected.includes(num)) {
            onSelect(selected.filter(n => n !== num));
        } else if (maxTeeth === 1) {
            onSelect([num]);
        } else if (selected.length < maxTeeth) {
            onSelect([...selected, num]);
        }
    };

    const ToothItem = ({ num, isUpper }) => {
        const sel = selected.includes(num);
        return (
            <div className="tooth-wrapper" onClick={() => toggle(num)} title={`Tooth ${num}`}>
                <div className={`tooth-shape ${isUpper ? 'upper' : 'lower'} ${sel ? 'tooth-selected' : ''}`} />
                <span className="tooth-num">{num}</span>
            </div>
        );
    };

    const Row = ({ left, right, isUpper }) => (
        <div className="tooth-row">
            <div className="tooth-quad">
                {left.map(n => <ToothItem key={n} num={n} isUpper={isUpper} />)}
            </div>
            <div className="arch-divider" />
            <div className="tooth-quad">
                {right.map(n => <ToothItem key={n} num={n} isUpper={isUpper} />)}
            </div>
        </div>
    );

    return (
        <div className="tooth-chart-container">
            <Row left={teeth.upperLeft} right={teeth.upperRight} isUpper />
            <div className="arch-row-divider" />
            <Row left={teeth.lowerLeft} right={teeth.lowerRight} isUpper={false} />
            {selected.length > 0 && (
                <div className="selected-tooth-display">
                    Selected Tooth{selected.length > 1 ? 's' : ''}: {selected.sort((a, b) => a - b).join(', ')}
                </div>
            )}
        </div>
    );
}

/* ─── Service Card Component ────────────────────────────────── */
function ServiceCard({ service, data, onUpdate }) {
    const { checked = false, isChild = false, teeth = [] } = data;

    const toggleChecked = () => {
        onUpdate({ ...data, checked: !checked, teeth: [] });
    };

    const setChild = (val) => {
        onUpdate({ ...data, isChild: val, teeth: [] });
    };

    const setTeeth = (t) => {
        onUpdate({ ...data, teeth: t });
    };

    const getError = () => {
        if (!checked || !service.needsTooth) return null;
        if (service.maxTeeth === 1 && teeth.length !== 1) {
            return 'Please select exactly one tooth';
        }
        if (service.maxTeeth > 1 && teeth.length === 0) {
            return 'Please select at least one tooth';
        }
        return null;
    };

    const getToothLabel = () => {
        if (service.maxTeeth === 1) return 'Select Single Tooth';
        return `Select Segment Teeth (Max ${service.maxTeeth})`;
    };

    const error = getError();

    return (
        <div className={`diagnostic-service-card ${checked ? 'checked' : ''}`}>
            {/* Checkbox Header */}
            <label className="diagnostic-service-header">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={toggleChecked}
                    className="diagnostic-checkbox"
                />
                <span className="diagnostic-service-label">{service.label}</span>
            </label>

            {/* Expanded Content */}
            {checked && service.needsTooth && (
                <div className="diagnostic-service-body">
                    {/* Child Question */}
                    <div className="child-question-row">
                        <span className="child-question-label">Is the patient a child?</span>
                        <div className="child-radio-group">
                            <label className="child-radio">
                                <input
                                    type="radio"
                                    name={`child-${service.id}`}
                                    checked={isChild === true}
                                    onChange={() => setChild(true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="child-radio">
                                <input
                                    type="radio"
                                    name={`child-${service.id}`}
                                    checked={isChild === false}
                                    onChange={() => setChild(false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    {/* Tooth Selection */}
                    <div className="tooth-selection-section">
                        <p className="tooth-selection-label">
                            {getToothLabel()} {service.maxTeeth > 1 && `(${teeth.length}/${service.maxTeeth} selected)`}
                        </p>
                        <ToothChart
                            isChild={isChild}
                            selected={teeth}
                            onSelect={setTeeth}
                            maxTeeth={service.maxTeeth}
                        />
                        {error && <div className="tooth-error-message">{error}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────── */
const DiagnosticServices = ({ services: externalServices, onServicesChange, onPrev, onNext }) => {
    const [services, setServices] = useState(() => {
        if (externalServices && Object.keys(externalServices).length > 0) {
            return externalServices;
        }
        return SERVICES.reduce((acc, s) => {
            acc[s.id] = { checked: false, isChild: false, teeth: [], needsTooth: s.needsTooth, maxTeeth: s.maxTeeth, label: s.label };
            return acc;
        }, {});
    });

    const updateService = (id, data) => {
        const updated = { ...services, [id]: data };
        setServices(updated);
        if (onServicesChange) {
            onServicesChange(updated);
        }
    };

    const checkedCount = SERVICES.filter(s => services[s.id]?.checked).length;

    return (
        <>
            <div className="form-section-header">
                <div className="section-icon"><Monitor size={20} /></div>
                <h2>3D Diagnostic Services (CBCT)</h2>
            </div>

            <div className="diagnostic-services-list">
                {SERVICES.map(service => (
                    <ServiceCard
                        key={service.id}
                        service={service}
                        data={services[service.id]}
                        onUpdate={(data) => updateService(service.id, data)}
                    />
                ))}
            </div>

            {checkedCount > 0 && (
                <div className="selected-services-summary" style={{ marginTop: '1.5rem' }}>
                    <strong>{checkedCount} service{checkedCount > 1 ? 's' : ''} selected</strong>
                </div>
            )}

            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-add-secondary" onClick={onPrev}>← Back</button>
                <button type="button" className="btn-next" onClick={onNext}>
                    Next Step <ChevronRight size={18} />
                </button>
            </div>
        </>
    );
};

export default DiagnosticServices;
