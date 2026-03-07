import { useState } from 'react';
import { Upload, Check, X } from 'lucide-react';

const ExpenseForm = () => {
    const [formData, setFormData] = useState({
        date: '',
        amount: '',
        reason: '',
        category: 'Decor',
        receipt: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFormData(prev => ({ ...prev, receipt: e.target.files[0] }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Expense submitted:', formData);
        // TODO: Send to backend API
        alert('Expense submitted (mock)');
        setFormData({ date: '', amount: '', reason: '', category: 'Decor', receipt: null });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
            <h2 className="text-xl font-bold text-deep-teal mb-6">Add New Expense</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-deep-teal focus:border-deep-teal"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
                        <input
                            type="number"
                            name="amount"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-deep-teal focus:border-deep-teal"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason/Description</label>
                    <input
                        type="text"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-deep-teal focus:border-deep-teal"
                        placeholder="e.g. Flowers for wedding"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-deep-teal focus:border-deep-teal"
                        >
                            <option value="Decor">Decor</option>
                            <option value="Catering">Catering</option>
                            <option value="Venue">Venue</option>
                            <option value="Logistics">Logistics</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Upload</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="image/*,.pdf"
                            />
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                <Upload size={24} className="mb-2" />
                                <span className="text-xs">{formData.receipt ? formData.receipt.name : 'Click to upload'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        className="mr-3 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                        onClick={() => setFormData({ date: '', amount: '', reason: '', category: 'Decor', receipt: null })}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-deep-teal text-white font-bold rounded-md hover:bg-opacity-90 transition-colors shadow-md"
                    >
                        Submit Expense
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
